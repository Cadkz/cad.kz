import { cache } from 'react'
import type { ProductCardData } from '@/components/ProductCard/ProductCard'
import { cardText } from '@/domain/cardTexts.mjs'
import { productRequestKey } from '@/domain/cart.mjs'
import { plainTitle, withTitleAlias } from '@/domain/productTitle.mjs'
import type { Manufacturer, Offer, Product, Section } from '../../payload-types'
import { cardAction, resolveScenario, type Scenario } from '../domain/buyScenario.mjs'
import { courseTopic } from '../domain/courseTopics.mjs'
import { cheapestTotal } from '../domain/picker.mjs'
import { compareInSection, priorityRank } from '../domain/priority.mjs'
import { itemGroup, topSections, withTopSections } from '../domain/sectionTree.mjs'
import { catalogExtras } from './catalogExtras'
import { type CatalogVariant, catalogVariants } from './catalogVariants'
import { catalogAvailable, lifecycle, type ResearchData, readResearch } from './equipmentResearch'
import { familyLines } from './families'
import { withFamilies } from './familyCards'
import { formatKzt } from './format'
import { cms } from './payload'
import { pickerView } from './picker'
import { cardPictures, type Picture, vendorPictures } from './pictures'
import { loadPricingContext, type PricingContext, quoteOffer } from './pricing'
import { productPath } from './productPath'
import { relId } from './rel'

export type CatalogGroup = 'software' | 'hardware' | 'service'

/** Товар каталога с признаками для каскадного фильтра. */
export type CatalogItem = ProductCardData & {
  research?: ResearchData | null
  group: CatalogGroup
  directions: string[]
  types: string[]
  vendor: string | null
  /** Другие названия для поиска из админки («акад, автокад»). */
  aliases: string | null
  tasks: string[]
  /** Приоритет показа (src/domain/priority.mjs): больше — выше в списке. */
  rank: number
  /** Сценарий покупки: от него кнопки карточки и страницы товара. */
  scenario: Scenario
  /** Основной раздел (slug): в своём разделе товар стоит выше, чем в чужом. */
  main: string | null
  /** Линейка производителя (id строкой) и порядок в ней: путь «производитель → линейка». */
  line: string | null
  lineOrder: number | null
  /** «Сорт.» производителя: порядок плиток производителей (src/domain/catalogTree.mjs). */
  vendorOrder?: number
  /**
   * Когда карточка видна (src/lib/catalogFilter.ts): all — всегда; family — карточка семейства,
   * пока не выбран производитель; detail — программа семейства или пакет, когда выбран
   * производитель или задача; task — отдельная программа подбора, только когда выбрана задача.
   */
  scope: 'all' | 'family' | 'detail' | 'task'
}

/** Линейка производителя для шага каталога. familyHref — страница семейства, если она есть. */
export type CatalogLine = {
  id: string
  title: string
  vendor: string
  order: number
  familyHref: string | null
}

export type Facet = {
  slug: string
  title: string
  group: CatalogGroup
  isDirection: boolean
  /** Производители, которые в этом разделе показываются первыми, по порядку. */
  pins?: string[]
  /**
   * Родительский раздел (slug): у подраздела («Плоттеры» внутри «Широкоформатных плоттеров»).
   * В списке типов фильтра подразделов нет, они открываются плитками внутри родителя.
   */
  parent?: string
  /** Короткое описание раздела: подпись плитки типа оборудования. */
  summary?: string
  /** Иконка раздела: на плитке типа, если у товаров нет фото. */
  icon?: string
}

export type Direction = {
  slug: string
  /** Своя ссылка вместо каталога направления (плитки «Оборудование», «Обучение и внедрение»). */
  href?: string
  title: string
  summary: string | null
  icon: string | null
  tone: NonNullable<Section['tone']>
}

export const kindGroup: Record<Product['kind'], CatalogGroup> = {
  software: 'software',
  hardware: 'hardware',
  course: 'service',
  service: 'service',
}

const published = { status: { equals: 'published' } } as const

/** «Сорт.» производителя в товар каталога, только если задан. */
const optionalOrder = (order: number | null | undefined) =>
  order == null ? {} : { vendorOrder: order }

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

/**
 * Цена «от» товара с подбором по шагам — самый дешёвый комплект, который реально собрать
 * на странице (основа + обязательный выбор или готовый комплект), а не самое дешёвое из
 * собственных предложений товара: иначе каталог и страница товара показывают разное.
 */
function pickerFrom(
  product: Product,
  offersByProduct: Map<number, Offer[]>,
  titles: Map<number, string>,
  context: PricingContext,
) {
  const view = pickerView(product, offersByProduct, titles, context)
  const byId = new Map(
    view.steps
      .flatMap((step) => step.items)
      .flatMap((item) => offersByProduct.get(item.productId) ?? [])
      .map((offer) => [String(offer.id), offer]),
  )
  const total = cheapestTotal(view, (offerId) => {
    const offer = byId.get(offerId)
    if (!offer) return null
    try {
      return BigInt(quoteOffer(offer, context).unitKzt)
    } catch {
      return null
    }
  })
  return total == null ? null : formatKzt(total.toString())
}

/**
 * Предложение, которое можно сразу положить в корзину из карточки: ровно одна комплектация
 * с ценой и обычная страница товара. При нескольких комплектациях или подборе по шагам
 * выбор — на странице товара, чтобы в корзину не попал случайный вариант (решение 08.10.2026).
 */
function cartOffer(product: Product, offers: Offer[], context: PricingContext) {
  return product.pageView === 'picker' ? null : singleOffer(offers, context)
}

/** Единственное предложение с ценой — его ID, иначе null. */
function singleOffer(offers: Offer[], context: PricingContext) {
  const [only] = offers
  if (offers.length !== 1 || !only) return null
  try {
    quoteOffer(only, context)
    return String(only.id)
  } catch {
    return null
  }
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

/**
 * Все опубликованные товары с ценой «от» и признаками фильтра. Один набор запросов на страницу:
 * повторный вызов в том же запросе (каталог, поиск, подборки на странице товара) берёт готовое.
 */
export const getCatalog = cache(loadCatalog)

async function loadCatalog(): Promise<{
  items: CatalogItem[]
  /** Дополнительные карточки только для страницы каталога (src/lib/catalogExtras.ts). */
  extras: CatalogItem[]
  /** Модули, пакеты и программы семейств внутри карточек — для Кадди (src/lib/catalogVariants.ts). */
  variants: CatalogVariant[]
  facets: Facet[]
  lines: CatalogLine[]
  /** Логотипы производителей для плиток шага «производитель», по названию. */
  vendorLogos: Record<string, Picture>
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

  const [pictures, logos] = await Promise.all([
    cardPictures(payload, products.docs, manufacturers.docs),
    vendorPictures(payload, manufacturers.docs),
  ])
  const sectionById = new Map(sections.docs.map((section) => [section.id, section]))
  // Подразделы (у раздела есть родитель) видны через верхний раздел: src/domain/sectionTree.mjs.
  const top = topSections(sections.docs.map((s) => ({ id: s.id, parent: relId(s.parent) })))
  const vendorById = new Map(manufacturers.docs.map((m: Manufacturer) => [m.id, m.title]))
  const vendorLevel = new Map(manufacturers.docs.map((m: Manufacturer) => [m.id, m.priority]))
  const vendorOrder = new Map(manufacturers.docs.map((m: Manufacturer) => [m.id, m.order]))
  const titleById = new Map(products.docs.map((product) => [product.id, product.title]))
  const offersByProduct = new Map<number, Offer[]>()
  for (const offer of offers.docs) {
    const productId = relId(offer.product)
    if (productId == null) continue
    offersByProduct.set(productId, [...(offersByProduct.get(productId) ?? []), offer])
  }

  const replacements = new Map(
    products.docs.map((entry) => [
      entry.slug,
      {
        title: entry.title,
        href: entry.status === 'published' && entry.pageView !== 'none' ? productPath(entry) : null,
      },
    ]),
  )
  const items = products.docs.filter(catalogAvailable).map((product): CatalogItem => {
    const ownIds = (product.sections ?? []).map((section) => relId(section) ?? -1)
    const productSections = withTopSections(ownIds, top)
      .map((id) => sectionById.get(id))
      .filter((section): section is Section => Boolean(section))
    const mainId = relId(product.mainSection) ?? -1
    const mainSection = sectionById.get(mainId)
    const topMain = sectionById.get(top.get(mainId) ?? mainId)
    const group = itemGroup(product.kind, topMain?.menuGroup)
    const scenario = resolveScenario({
      own: product.scenario,
      section: mainSection?.scenario ?? topMain?.scenario,
      kind: product.kind,
    })
    const productOffers = offersByProduct.get(product.id) ?? []
    const requires = (product.requiresProducts ?? [])
      .map((item) => titleById.get(relId(item) ?? -1))
      .filter(Boolean)
    const vendorId = relId(product.manufacturer) ?? -1
    const vendor = vendorById.get(vendorId) ?? null
    const offersCount =
      product.pageView === 'picker' ? Math.max(productOffers.length, 2) : productOffers.length
    const cartId = cartOffer(product, productOffers, context)
    // У курсов нет картинок (замечание владельца 27.10.2026): значок категории курса.
    // «Корпоративное обучение» заведено услугой, но стоит в «Обучении» — тоже по категории.
    const topic =
      product.kind === 'course' || productSections.some((s) => s.slug === 'training')
        ? courseTopic(
            product.title,
            productSections.filter((s) => s.isDirection).map((s) => s.slug),
          )
        : null
    const action = cardAction({
      scenario,
      demo: Boolean(mainSection?.demoButton ?? topMain?.demoButton),
      cart: cartId != null,
    })
    return {
      id: product.id,
      href: productPath(product),
      title: plainTitle(product.title),
      manufacturer: vendor,
      vendor,
      aliases: withTitleAlias(product.searchAliases, product.title),
      summary: product.summary ?? null,
      cardText: cardText(product.slug, product.summary ?? null, product.title),
      research: readResearch(product.researchData),
      lifecycle: lifecycle(readResearch(product.researchData), replacements),
      icon: topic?.icon ?? productSections[0]?.icon ?? null,
      picture: topic ? null : (pictures.get(product.id) ?? null),
      logoFallback: group === 'software' ? vendor : null,
      // Услуги без картинки — тематический чертёж раздела (внедрение, обучение), а не ключ.
      art: group === 'service' && !topic ? (productSections[0]?.slug ?? null) : null,
      priceFrom:
        product.pageView === 'picker'
          ? pickerFrom(product, offersByProduct, titleById, context)
          : cheapest(productOffers, context),
      // У подбора вариантов всегда несколько: цена показывается с «от».
      offersCount,
      // Корзина из карточки — только где сценарий её предлагает (src/domain/buyScenario.mjs).
      cartOfferId: action.cart ? cartId : null,
      // Без одной комплектации с ценой — в корзину запросом, комплектацию подберёт менеджер.
      requestKey: productRequestKey(product.id),
      badge: requires.length ? `Плагин для ${requires.join(' / ')}` : null,
      group,
      scenario,
      // Направления — разделы программ: курсы и оборудование в них не показываются, их направление
      // нужно только подборкам «С этим покупают».
      directions:
        group === 'software' ? productSections.filter((s) => s.isDirection).map((s) => s.slug) : [],
      types: productSections.filter((s) => !s.isDirection).map((s) => s.slug),
      tasks: (product.tasks ?? []).map((task) => task.title),
      rank: priorityRank(product.priority, vendorLevel.get(vendorId), product.topOrder),
      main: topMain?.slug ?? null,
      line: product.line == null ? null : String(relId(product.line)),
      lineOrder: product.lineOrder ?? null,
      // Только заданный: пустой не занимает место в данных каталога, которые уходят в браузер.
      ...optionalOrder(vendorOrder.get(vendorId)),
      scope: 'all',
      ...(topic ? { topic: topic.key } : {}),
    }
  })
  const hidden = new Set(products.docs.filter((p) => p.pageView === 'none').map((p) => p.id))
  const families = await familyLines()
  const extras = catalogExtras({
    items,
    products: products.docs,
    offersByProduct,
    families,
    priceOf: (list) => cheapest(list, context),
    cartOf: (list) => singleOffer(list, context),
  })
  const variants = catalogVariants({
    items,
    products: products.docs,
    offersByProduct,
    families,
    priceOf: (list) => cheapest(list, context),
  })
  const listed = withFamilies(items, hidden, families, (ids) => {
    const list = ids.flatMap((id) => offersByProduct.get(id) ?? [])
    return { priceFrom: cheapest(list, context), offers: list.length }
  })
  // Без выбранного раздела: топы продаж первыми, дальше по названию.
  listed.sort(compareInSection())

  // Подразделы тоже в списке (с родителем): по ним шаг «подраздел» плитками и путь «Назад».
  const facets = sections.docs.map((section): Facet => {
    const parent = sectionById.get(relId(section.parent) ?? -1)
    const topGroup = sectionById.get(top.get(section.id) ?? section.id)?.menuGroup
    return {
      slug: section.slug,
      title: section.title,
      group: topGroup ?? section.menuGroup,
      isDirection: Boolean(section.isDirection),
      pins: (section.pinnedManufacturers ?? [])
        .map((m) => vendorById.get(relId(m) ?? -1))
        .filter((title): title is string => Boolean(title)),
      ...(parent ? { parent: parent.slug } : {}),
      ...(section.summary ? { summary: section.summary } : {}),
      ...(section.icon ? { icon: section.icon } : {}),
    }
  })
  const lines = productLines.docs.flatMap((line) => {
    const vendor = vendorById.get(relId(line.manufacturer) ?? -1)
    return vendor
      ? [
          {
            id: String(line.id),
            title: plainTitle(line.title),
            vendor,
            order: line.order ?? 100,
            familyHref: families.get(line.id)?.href ?? null,
          },
        ]
      : []
  })
  return { items: listed, extras, variants, facets, lines, vendorLogos: Object.fromEntries(logos) }
}

/** Длина описания в карточке: на компьютере видно три строки, этого хватает с запасом. */
const SUMMARY_LIMIT = 160

function shortText(text: string | null) {
  if (!text || text.length <= SUMMARY_LIMIT) return text
  const cut = text.slice(0, SUMMARY_LIMIT)
  return `${cut.slice(0, cut.lastIndexOf(' ') > 0 ? cut.lastIndexOf(' ') : SUMMARY_LIMIT).trimEnd()}…`
}

/**
 * Лёгкий список для фильтра каталога в браузере (аудит 21.10.2026, С1): только то, что нужно
 * карточке и фильтру. Без других названий для поиска и подписи картинки, описание — коротким.
 */
export function clientItems(items: CatalogItem[]): CatalogItem[] {
  return items.map((item) => ({
    ...item,
    aliases: null,
    summary: shortText(item.summary),
    picture: item.picture && { ...item.picture, alt: '' },
  }))
}
