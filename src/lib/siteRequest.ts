import { randomInt } from 'node:crypto'
import {
  commitTransaction,
  createLocalReq,
  initTransaction,
  killTransaction,
  type Payload,
} from 'payload'
import { handoffDetails } from '@/domain/assistant.mjs'
import { resolveScenario, SCENARIO_LABELS } from '@/domain/buyScenario.mjs'
import {
  CONSENT_TEXT,
  CONSENT_VERSION,
  KIND_LABELS,
  makeRequestNumber,
  type ResolvedLine,
  type SiteRequest,
  toCrmRequest,
} from '@/domain/siteRequest.mjs'
import type { Offer } from '../../payload-types'
import { findConversation, saveConversation } from './assistant/conversation'
import { findPublicOffer, loadPricingContext, quoteOffer } from './pricing'
import { productPath } from './productPath'

const options = { overrideAccess: true, depth: 0 } as const
export const HOURLY_PHONE_LIMIT = 5

/** Названия и цены выбранного — из базы по ID. Чужое предложение или снятый товар пропускаются. */
async function resolveLines(payload: Payload, request: SiteRequest): Promise<ResolvedLine[]> {
  const context = await loadPricingContext(payload)
  const lines: ResolvedLine[] = []
  for (const item of request.items) {
    if (item.offerId) {
      const found = await findPublicOffer(payload, item.offerId)
      if (!found || found.product.id !== item.productId) continue
      lines.push(priced(found.product.title, found.offer, request.quantity, context))
      continue
    }
    const { docs } = await payload.find({
      collection: 'products',
      where: { and: [{ id: { equals: item.productId } }, { status: { equals: 'published' } }] },
      limit: 1,
      ...options,
    })
    if (docs[0])
      lines.push({
        offerId: null,
        title: docs[0].title,
        configuration: '',
        license: '',
        quantity: request.quantity,
        unitKzt: null,
        totalKzt: null,
      })
  }
  return lines
}

function priced(
  title: string,
  offer: Offer,
  quantity: number,
  context: Awaited<ReturnType<typeof loadPricingContext>>,
): ResolvedLine {
  const base = {
    offerId: String(offer.id),
    title,
    configuration: offer.configuration,
    license: offer.license,
    quantity,
  }
  try {
    const quote = quoteOffer(offer, context, quantity)
    return { ...base, unitKzt: quote.unitKzt, totalKzt: quote.totalKzt }
  } catch {
    return { ...base, unitKzt: null, totalKzt: null }
  }
}

/** С главной: направление, если клиент его выбрал и такое направление опубликовано. */
async function homeChoices(payload: Payload, request: SiteRequest) {
  if (!request.direction) return []
  const { docs } = await payload.find({
    collection: 'sections',
    where: {
      and: [
        { slug: { equals: request.direction } },
        { isDirection: { equals: true } },
        { status: { equals: 'published' } },
      ],
    },
    limit: 1,
    ...options,
  })
  return docs[0] ? [{ title: 'Направление', value: docs[0].title }] : []
}

/** Со страницы продления: программа, номер лицензии и число мест, как их указал клиент. */
function renewalChoices(request: SiteRequest) {
  const renewal = request.renewal
  if (!renewal) return []
  return [
    { title: 'Программа', value: renewal.program },
    ...(renewal.license ? [{ title: 'Номер лицензии', value: renewal.license }] : []),
    ...(renewal.seats ? [{ title: 'Мест', value: String(renewal.seats) }] : []),
  ]
}

/** Выбор переключателей, который действительно есть в подборе товара: остальное отбрасывается. */
async function checkedChoices(payload: Payload, request: SiteRequest) {
  if (request.source === 'home') return homeChoices(payload, request)
  if (request.source === 'renew') return renewalChoices(request)
  if (request.source === 'assistant') return []
  if (!request.choices.length || request.familySlug || request.pageProductId === null) return []
  const product = await payload.findByID({
    collection: 'products',
    id: request.pageProductId,
    disableErrors: true,
    ...options,
  })
  const switches = product?.picker?.switches ?? []
  return request.choices.filter((choice) =>
    switches.some(
      (sw) => sw.title === choice.title && (sw.options ?? []).some((o) => o.value === choice.value),
    ),
  )
}

/**
 * Раздел и сценарий покупки товара страницы — для анализа сделок в Битрикс24. Сценарий считается
 * так же, как кнопки на странице (src/domain/buyScenario.mjs).
 */
async function productContext(payload: Payload, request: SiteRequest) {
  const id = request.pageProductId
  if (request.source !== 'product' || id === null) return { section: null, scenario: null }
  const product = await payload.findByID({
    collection: 'products',
    id,
    depth: 1,
    disableErrors: true,
    overrideAccess: true,
    select: { kind: true, scenario: true, mainSection: true },
  })
  if (!product) return { section: null, scenario: null }
  const main = typeof product.mainSection === 'object' ? product.mainSection : null
  const scenario = resolveScenario({
    own: product.scenario,
    section: main?.scenario,
    kind: product.kind,
  })
  return { section: main?.title ?? null, scenario: SCENARIO_LABELS[scenario] }
}

/** Название страницы для менеджера: товар, семейство, продление или главная. */
async function pageTitle(payload: Payload, request: SiteRequest) {
  if (request.source === 'renew') return { title: 'Продление лицензий', page: '/renew' }
  if (request.source === 'assistant') return { title: 'Чат с Кадди на сайте', page: request.page }
  if (request.source === 'home' || request.pageProductId === null)
    return { title: 'Главная: подобрать решение', page: '/' }
  if (request.familySlug) {
    const { docs } = await payload.find({
      collection: 'product-lines',
      where: { slug: { equals: request.familySlug } },
      limit: 1,
      ...options,
    })
    if (docs[0]) return { title: docs[0].title, page: `/families/${request.familySlug}` }
  }
  const { docs } = await payload.find({
    collection: 'products',
    where: { id: { equals: request.pageProductId } },
    limit: 1,
    ...options,
  })
  return { title: docs[0]?.title ?? 'Сайт', page: docs[0] ? productPath(docs[0]) : null }
}

/** Разговор с Кадди передан менеджеру: в журнале видно, с какой заявкой. Не вышло — не страшно. */
async function markHandedOff(
  payload: Payload,
  key: string,
  conversation: NonNullable<Awaited<ReturnType<typeof findConversation>>>,
  number: string,
) {
  try {
    await saveConversation(
      payload,
      key,
      conversation,
      { ...conversation.snapshot, requestNumber: number },
      'handed-off',
    )
  } catch (error) {
    console.error(
      'Не удалось отметить разговор переданным',
      error instanceof Error ? error.name : '',
    )
  }
}

export type SavedRequest = { number: string; repeated: boolean; idempotencyKey: string }

/**
 * Сохраняет заявку и запись очереди CRM одной транзакцией. Повтор с тем же ключом не создаёт
 * вторую заявку. Больше HOURLY_PHONE_LIMIT заявок с одного телефона за час — отказ.
 */
export async function saveSiteRequest(
  payload: Payload,
  request: SiteRequest,
  clientHash: string,
): Promise<SavedRequest | 'rate_limited'> {
  const existing = await payload.find({
    collection: 'site-requests',
    where: { idempotencyKey: { equals: request.idempotencyKey } },
    limit: 1,
    ...options,
  })
  if (existing.docs[0])
    return {
      number: existing.docs[0].number,
      repeated: true,
      idempotencyKey: request.idempotencyKey,
    }
  const recent = await payload.count({
    collection: 'site-requests',
    where: {
      and: [
        { contactPhone: { equals: request.phone } },
        { createdAt: { greater_than: new Date(Date.now() - 3_600_000).toISOString() } },
      ],
    },
    overrideAccess: true,
  })
  if (recent.totalDocs >= HOURLY_PHONE_LIMIT) return 'rate_limited'

  const [lines, page, choices, context, conversation] = await Promise.all([
    resolveLines(payload, request),
    pageTitle(payload, request),
    checkedChoices(payload, request),
    productContext(payload, request),
    request.conversationId ? findConversation(payload, request.conversationId) : null,
  ])
  const button = request.button || KIND_LABELS[request.kind]
  // Из чата: что Кадди собрал для менеджера (почта, компания, продукт, сроки) — с сервера, не из браузера.
  const draft = request.source === 'assistant' ? conversation?.snapshot.handoff : undefined
  const details = draft ? handoffDetails(draft) : []
  const comment = [
    request.comment,
    details.length
      ? `Собрал Кадди в чате:\n${details.map((d) => `${d.title}: ${d.value}`).join('\n')}`
      : '',
  ]
    .filter(Boolean)
    .join('\n\n')
  const priced = lines.filter((line) => line.totalKzt)
  const totalKzt =
    priced.length === lines.length && lines.length
      ? priced.reduce((sum, line) => sum + BigInt(line.totalKzt ?? '0'), 0n).toString()
      : null
  const now = new Date()
  const number = makeRequestNumber(now, randomInt)
  const lead = toCrmRequest({
    number,
    idempotencyKey: request.idempotencyKey,
    kind: request.kind,
    pageTitle: page.title,
    choices,
    name: request.name,
    phone: request.phone,
    ...(draft?.email ? { email: draft.email } : {}),
    // В CRM слова клиента и собранное Кадди идут разными блоками; в базе сайта — одной записью.
    comment: request.comment,
    summary: details,
    consentAt: now.toISOString(),
    lines,
    totalKzt,
    source: {
      button,
      product: request.source === 'product' && !request.familySlug ? page.title : null,
      section: context.section,
      scenario: context.scenario,
      page: page.page,
    },
    messages: conversation?.snapshot.messages,
  })

  const req = await createLocalReq({}, payload)
  const owner = await initTransaction(req)
  try {
    const created = await payload.create({
      collection: 'site-requests',
      data: {
        number,
        kind: request.kind,
        button,
        sectionTitle: context.section ?? undefined,
        scenario: context.scenario ?? undefined,
        mode: 'demo',
        productTitle: page.title,
        page: page.page ?? undefined,
        contactName: request.name,
        contactPhone: request.phone,
        comment: comment || undefined,
        items: { lines, choices: details.length ? details : choices },
        totalKzt: totalKzt ?? undefined,
        consent: {
          accepted: true,
          at: now.toISOString(),
          version: CONSENT_VERSION,
          text: CONSENT_TEXT,
        },
        idempotencyKey: request.idempotencyKey,
        clientHash: clientHash || undefined,
      },
      req,
      ...options,
    })
    await payload.create({
      collection: 'crm-deliveries',
      data: {
        idempotencyKey: request.idempotencyKey,
        request: created.id,
        state: 'pending',
        attempts: 0,
        snapshot: structuredClone(lead),
      },
      req,
      ...options,
    })
    if (owner) await commitTransaction(req)
    if (conversation && request.conversationId)
      await markHandedOff(payload, request.conversationId, conversation, number)
    return { number, repeated: false, idempotencyKey: request.idempotencyKey }
  } catch (error) {
    if (owner) await killTransaction(req)
    throw error
  }
}
