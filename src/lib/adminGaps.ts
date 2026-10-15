import type { Payload } from 'payload'
import {
  GAP_HINTS,
  GAP_LABELS,
  GAPS,
  type Gap,
  levelRank,
  productGaps,
} from '@/domain/adminQueue.mjs'
import { resolveScenario } from '@/domain/buyScenario.mjs'
import type { QueueCard } from './adminQueue'
import { loadPricingContext, quoteOffer } from './pricing'

const OPTS = { overrideAccess: true, depth: 0, pagination: false } as const

/** Сколько карточек каждого вида показывать списком (остальное — числом). */
const SHOW = 5

function id(value: number | { id: number } | null | undefined) {
  if (value == null) return null
  return typeof value === 'number' ? value : value.id
}

/**
 * Неполные карточки опубликованных товаров: без предложений, без цены (где покупают корзиной),
 * без картинки, без описания. Внутри вида — сначала флагманы и топы продаж.
 */
export async function loadGapCards(payload: Payload): Promise<QueueCard[]> {
  const [products, offers, sections, makers, context] = await Promise.all([
    payload.find({
      collection: 'products',
      where: { status: { equals: 'published' } },
      select: {
        title: true,
        kind: true,
        scenario: true,
        mainSection: true,
        gallery: true,
        description: true,
        priority: true,
        manufacturer: true,
      },
      ...OPTS,
    }),
    payload.find({
      collection: 'offers',
      where: { status: { equals: 'published' } },
      select: { product: true, amount: true, currency: true, includesVat: true, sourceVat: true },
      ...OPTS,
    }),
    payload.find({ collection: 'sections', select: { scenario: true }, ...OPTS }),
    payload.find({ collection: 'manufacturers', select: { priority: true }, ...OPTS }),
    loadPricingContext(payload),
  ])

  const offerCount = new Map<number, { all: number; priced: number }>()
  for (const offer of offers.docs) {
    const productId = id(offer.product)
    if (productId == null) continue
    const count = offerCount.get(productId) ?? { all: 0, priced: 0 }
    count.all++
    try {
      if (BigInt(quoteOffer(offer, context).unitKzt) > 0n) count.priced++
    } catch {
      // Цена не считается (нет курса, «по запросу») — значит, цены нет.
    }
    offerCount.set(productId, count)
  }
  const sectionScenario = new Map(sections.docs.map((s) => [s.id, s.scenario ?? null]))
  const makerLevel = new Map(makers.docs.map((m) => [m.id, m.priority ?? null]))

  const byGap = new Map<Gap, { id: number; title: string; rank: number }[]>(
    GAPS.map((gap) => [gap, []]),
  )
  for (const product of products.docs) {
    const count = offerCount.get(product.id) ?? { all: 0, priced: 0 }
    const scenario = resolveScenario({
      own: product.scenario,
      section: sectionScenario.get(id(product.mainSection) ?? -1) ?? null,
      kind: product.kind,
    })
    const gaps = productGaps({
      offers: count.all,
      priced: count.priced,
      hasImage: (product.gallery ?? []).length > 0,
      hasDescription: Boolean(product.description?.trim()),
      needsPrice: scenario === 'standard' || scenario === 'renewal',
    })
    const rank = levelRank(product.priority ?? makerLevel.get(id(product.manufacturer) ?? -1))
    for (const gap of gaps) byGap.get(gap)?.push({ id: product.id, title: product.title, rank })
  }

  return GAPS.map((gap) => {
    const list = (byGap.get(gap) ?? []).sort(
      (a, b) => a.rank - b.rank || a.title.localeCompare(b.title, 'ru'),
    )
    return {
      key: `gap-${gap}`,
      title: GAP_LABELS[gap],
      hint: GAP_HINTS[gap],
      total: list.length,
      tone: 'normal',
      empty: 'У всех опубликованных товаров заполнено.',
      items: list.slice(0, SHOW).map((item) => ({
        id: String(item.id),
        title: item.title,
        href: `/admin/collections/products/${item.id}`,
        note: item.rank <= 1 ? 'топ продаж' : undefined,
      })),
    } satisfies QueueCard
  })
}
