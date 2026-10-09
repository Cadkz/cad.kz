import type { Payload } from 'payload'
import { priorityRank } from '../domain/priority.mjs'
import {
  crossFor,
  type RecItem,
  SECTION_MATCH,
  type SectionInfo,
  similarFor,
} from '../domain/recommend.mjs'
import type { RelatedProduct } from './product'
import { productPath } from './productPath'
import { relId, relIds } from './rel'

type RecData = { items: RecItem[]; info: SectionInfo; cards: Map<number, RelatedProduct> }

/** Все опубликованные товары в коротком виде и настройки разделов для подборок. */
async function loadRecData(payload: Payload): Promise<RecData> {
  const published = { status: { equals: 'published' } } as const
  const [products, sections, manufacturers] = await Promise.all([
    payload.find({
      collection: 'products',
      where: published,
      limit: 5000,
      pagination: false,
      depth: 0,
      select: {
        title: true,
        slug: true,
        legacyUrl: true,
        kind: true,
        manufacturer: true,
        mainSection: true,
        sections: true,
        requiresProducts: true,
        similarProducts: true,
        recommended: true,
        suggestSimilar: true,
        suggestCross: true,
        priority: true,
      },
    }),
    payload.find({
      collection: 'sections',
      where: published,
      limit: 500,
      pagination: false,
      depth: 0,
      select: { slug: true, isDirection: true, crossSections: true },
    }),
    payload.find({
      collection: 'manufacturers',
      limit: 500,
      pagination: false,
      depth: 0,
      select: { title: true, priority: true },
    }),
  ])
  const vendors = new Map(manufacturers.docs.map((m) => [m.id, m.title]))
  const vendorLevel = new Map(manufacturers.docs.map((m) => [m.id, m.priority]))
  const info: SectionInfo = new Map(
    sections.docs.map((s) => [
      s.id,
      {
        isDirection: Boolean(s.isDirection),
        cross: relIds(s.crossSections),
        match: Object.hasOwn(SECTION_MATCH, s.slug) ? SECTION_MATCH[s.slug] : undefined,
      },
    ]),
  )
  const items: RecItem[] = []
  const cards = new Map<number, RelatedProduct>()
  for (const product of products.docs) {
    const vendor = vendors.get(relId(product.manufacturer) ?? -1) ?? null
    const sectionIds = relIds(product.sections)
    items.push({
      id: product.id,
      title: product.title,
      vendor,
      kind: product.kind,
      main: relId(product.mainSection) ?? sectionIds[0] ?? null,
      sections: sectionIds,
      requires: relIds(product.requiresProducts),
      manualSimilar: relIds(product.similarProducts),
      manualCross: relIds(product.recommended),
      suggestSimilar: product.suggestSimilar !== false,
      suggestCross: product.suggestCross !== false,
      rank: priorityRank(product.priority, vendorLevel.get(relId(product.manufacturer) ?? -1)),
    })
    cards.set(product.id, {
      slug: product.slug,
      href: productPath(product),
      title: product.title,
      vendor,
    })
  }
  return { items, info, cards }
}

const toCards = (ids: number[], cards: Map<number, RelatedProduct>) =>
  ids.map((id) => cards.get(id)).filter((card): card is RelatedProduct => Boolean(card))

/** Подборки для страницы товара: «С этим покупают» и «Похожие» без повторов между ними. */
export async function getRecommendations(payload: Payload, productId: number) {
  const { items, info, cards } = await loadRecData(payload)
  const target = items.find((item) => item.id === productId)
  if (!target) return { cross: [], similar: [] }
  const cross = crossFor([target], items, info)
  const similar = similarFor(target, items, { exclude: cross })
  return { cross: toCards(cross, cards), similar: toCards(similar, cards) }
}

/** «С этим покупают» для корзины: по всем её товарам сразу, без самих товаров корзины. */
export async function getCartSuggestions(payload: Payload, productSlugs: string[], limit = 3) {
  const { items, info, cards } = await loadRecData(payload)
  const slugs = new Set(productSlugs)
  const targets = items.filter((item) => slugs.has(cards.get(item.id)?.slug ?? ''))
  if (!targets.length) return []
  return toCards(crossFor(targets, items, info, { limit }), cards)
}
