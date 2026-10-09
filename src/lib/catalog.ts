import type { ProductCardData } from '@/components/ProductCard/ProductCard'
import type { Manufacturer, Offer, Product, Section } from '../../payload-types'
import { compareInSection, priorityRank } from '../domain/priority.mjs'
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
  /** Приоритет показа (src/domain/priority.mjs): больше — выше в списке. */
  rank: number
  /** Основной раздел (slug): в своём разделе товар стоит выше, чем в чужом. */
  main: string | null
  /** Линейка производителя (id строкой) и порядок в ней: путь «производитель → линейка». */
  line: string | null
  lineOrder: number | null
}

/** Линейка производителя для шага каталога. */
export type CatalogLine = { id: string; title: string; vendor: string; order: number }

export type Facet = {
  slug: string
  title: string
  group: CatalogGroup
  isDirection: boolean
  /** Производители, которые в этом разделе показываются первыми, по порядку. */
  pins?: string[]
}

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
export async function getCatalog(): Promise<{
  items: CatalogItem[]
  facets: Facet[]
  lines: CatalogLine[]
}> {
  const payload = await cms()
  const [sections, products, offers, manufacturers, context, productLines] = await Promise.all([
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
    payload.find({
      collection: 'product-lines',
      where: published,
      pagination: false,
      depth: 0,
      select: { title: true, manufacturer: true, order: true },
    }),
  ])

  const pictures = await cardPictures(payload, products.docs, manufacturers.docs)
  const sectionById = new Map(sections.docs.map((section) => [section.id, section]))
  const vendorById = new Map(manufacturers.docs.map((m: Manufacturer) => [m.id, m.title]))
  const vendorLevel = new Map(manufacturers.docs.map((m: Manufacturer) => [m.id, m.priority]))
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
    const vendorId = relId(product.manufacturer) ?? -1
    const vendor = vendorById.get(vendorId) ?? null
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
      rank: priorityRank(product.priority, vendorLevel.get(vendorId)),
      main: sectionById.get(relId(product.mainSection) ?? -1)?.slug ?? null,
      line: product.line == null ? null : String(relId(product.line)),
      lineOrder: product.lineOrder ?? null,
    }
  })
  // Без выбранного раздела: топы продаж первыми, дальше по названию.
  items.sort(compareInSection())

  const facets = sections.docs.map((section) => ({
    slug: section.slug,
    title: section.title,
    group: section.menuGroup,
    isDirection: Boolean(section.isDirection),
    pins: (section.pinnedManufacturers ?? [])
      .map((m) => vendorById.get(relId(m) ?? -1))
      .filter((title): title is string => Boolean(title)),
  }))
  const lines = productLines.docs.flatMap((line) => {
    const vendor = vendorById.get(relId(line.manufacturer) ?? -1)
    return vendor
      ? [{ id: String(line.id), title: line.title, vendor, order: line.order ?? 100 }]
      : []
  })
  return { items, facets, lines }
}
