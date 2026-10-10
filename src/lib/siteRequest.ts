import { randomInt } from 'node:crypto'
import {
  commitTransaction,
  createLocalReq,
  initTransaction,
  killTransaction,
  type Payload,
} from 'payload'
import {
  CONSENT_TEXT,
  CONSENT_VERSION,
  makeRequestNumber,
  type ResolvedLine,
  type SiteRequest,
  toCrmRequest,
} from '@/domain/siteRequest.mjs'
import type { Offer } from '../../payload-types'
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

/** Выбор переключателей, который действительно есть в подборе товара: остальное отбрасывается. */
async function checkedChoices(payload: Payload, request: SiteRequest) {
  if (request.source === 'home') return homeChoices(payload, request)
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

/** Название страницы для менеджера: товар, семейство или главная. */
async function pageTitle(payload: Payload, request: SiteRequest) {
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

  const [lines, page, choices] = await Promise.all([
    resolveLines(payload, request),
    pageTitle(payload, request),
    checkedChoices(payload, request),
  ])
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
    comment: request.comment,
    consentAt: now.toISOString(),
    lines,
    totalKzt,
  })

  const req = await createLocalReq({}, payload)
  const owner = await initTransaction(req)
  try {
    const created = await payload.create({
      collection: 'site-requests',
      data: {
        number,
        kind: request.kind,
        mode: 'demo',
        productTitle: page.title,
        page: page.page ?? undefined,
        contactName: request.name,
        contactPhone: request.phone,
        comment: request.comment || undefined,
        items: { lines, choices },
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
    return { number, repeated: false, idempotencyKey: request.idempotencyKey }
  } catch (error) {
    if (owner) await killTransaction(req)
    throw error
  }
}
