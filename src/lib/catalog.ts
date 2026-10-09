import type { ProductCardData } from '@/components/ProductCard/ProductCard'
import type { Manufacturer, Offer, Product, Section } from '../../payload-types'
import { formatKzt } from './format'
import { cms } from './payload'
import { cardPictures } from './pictures'
import { loadPricingContext, type PricingContext, quoteOffer } from './pricing'
import { productPath } from './productPath'
import { relId } from './rel'

export type CatalogGroup = 'software' | 'hardware' | 'service'

/** Товар каталога с признаками для каскадного фильтра. */
export type CatalogItem = ProductCardData & {
  group: CatalogGroup
  directions: string[]
  types: string[]
  vendor: string | null
  tasks: string[]
}

export type Facet = { slug: string; title: string; group: CatalogGroup; isDirection: boolean }

export type Direction = {
  slug: string
  title: string
  summary: string | null
  icon: string | null
  tone: NonNullable<Section['tone']>
}

const kindGroup: Record<Product['kind'], CatalogGroup> = {
  software: 'software',
  hardware: 'hardware',
  course: 'service',
  service: 'service',
}

const published = { status: { equals: 'published' } } as const

/** Самая доступная комплектация, цена посчитана сервером. Ошибка курса не роняет каталог. */
function cheapest(offers: Offer[], context: PricingContext) {
  let best: { kzt: bigint; formatted: string } | null = null
  for (const offer of offers) {
    try {
      const unit = BigInt(quoteOffer(offer, context).unitKzt)
      if (!best || unit < best.kzt) best = { kzt: unit, formatted: formatKzt(unit.toString()) }
    } catch {
      // Цена без курса не показывается: такой товар будет «по запросу».
    }
  }
  return best?.formatted ?? null
}

export async function getDirections(): Promise<Direction[]> {
  const payload = await cms()
  const { docs } = await payload.find({
    collection: 'sections',
    where: { and: [published, { isDirection: { equals: true } }] },
    sort: ['order', 'title'],
    limit: 100,
    depth: 0,
  })
  return docs.map((section) => ({
    slug: section.slug,
    title: section.title,
    summary: section.summary ?? null,
    icon: section.icon ?? null,
    tone: section.tone ?? 'navy',
  }))
}

/** Все опубликованные товары с ценой «от» и признаками фильтра. Один набор запросов на страницу. */
export async function getCatalog(): Promise<{ items: CatalogItem[]; facets: Facet[] }> {
  const payload = await cms()
  const [sections, products, offers, manufacturers, context] = await Promise.all([
    payload.find({
      collection: 'sections',
      where: published,
      sort: ['order', 'title'],
      limit: 300,
      depth: 0,
    }),
    payload.find({
      collection: 'products',
      where: published,
      sort: 'title',
      limit: 1000,
      depth: 0,
    }),
    payload.find({ collection: 'offers', where: published, limit: 5000, depth: 0 }),
    payload.find({ collection: 'manufacturers', limit: 300, depth: 0 }),
    loadPricingContext(payload),
  ])

  const pictures = await cardPictures(payload, products.docs, manufacturers.docs)
  const sectionById = new Map(sections.docs.map((section) => [section.id, section]))
  const vendorById = new Map(manufacturers.docs.map((m: Manufacturer) => [m.id, m.title]))
  const titleById = new Map(products.docs.map((product) => [product.id, product.title]))
  const offersByProduct = new Map<number, Offer[]>()
  for (const offer of offers.docs) {
    const productId = relId(offer.product)
    if (productId == null) continue
    offersByProduct.set(productId, [...(offersByProduct.get(productId) ?? []), offer])
  }

  const items = products.docs.map((product): CatalogItem => {
    const productSections = (product.sections ?? [])
      .map((section) => sectionById.get(relId(section) ?? -1))
      .filter((section): section is Section => Boolean(section))
    const productOffers = offersByProduct.get(product.id) ?? []
    const requires = (product.requiresProducts ?? [])
      .map((item) => titleById.get(relId(item) ?? -1))
      .filter(Boolean)
    const vendor = vendorById.get(relId(product.manufacturer) ?? -1) ?? null
    const only = productOffers.length === 1 ? productOffers[0] : null
    return {
      id: product.id,
      href: productPath(product),
      title: product.title,
      manufacturer: vendor,
      vendor,
      summary: product.summary ?? null,
      icon: productSections[0]?.icon ?? null,
      picture: pictures.get(product.id) ?? null,
      priceFrom: cheapest(productOffers, context),
      offersCount: productOffers.length,
      singleOffer: only ? { id: String(only.id), configuration: only.configuration } : null,
      badge: requires.length ? `Плагин для ${requires.join(' / ')}` : null,
      group: kindGroup[product.kind],
      directions: productSections.filter((s) => s.isDirection).map((s) => s.slug),
      types: productSections.filter((s) => !s.isDirection).map((s) => s.slug),
      tasks: (product.tasks ?? []).map((task) => task.title),
    }
  })

  const facets = sections.docs.map((section) => ({
    slug: section.slug,
    title: section.title,
    group: section.menuGroup,
    isDirection: Boolean(section.isDirection),
  }))
  return { items, facets }
}
