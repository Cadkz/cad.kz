// Сведение выгрузок Битрикса в товары и предложения нового сайта. Ничего не пишет:
// возвращает данные для импорта и список проблем для отчёта проверочного прогона.
import { isYes, parseBitrixPrice, parseVatRate, priceProblem } from './bitrixPrice.mjs'
import { htmlToMarkup } from './bitrixText.mjs'

/**
 * @typedef {Record<string, string>[]} Rows
 * @typedef {{ type: string, id: string, title: string, detail?: string }} CatalogIssue
 * @typedef {{ amount: string, currency: string, includesVat: boolean, sourceVat: string }} CatalogPrice
 * @typedef {object} CatalogProduct
 * @property {string} legacyKey
 * @property {string} bitrixId
 * @property {string} title
 * @property {string} slug
 * @property {'software' | 'hardware' | 'course' | 'service'} kind
 * @property {string | null} manufacturer
 * @property {string[]} oldSections
 * @property {string | null} summary
 * @property {string | null} description
 * @property {string[]} images
 * @property {string[]} relatedBitrixIds
 * @property {{ name: string, value: string }[]} properties
 * @property {CatalogPrice | null} price
 * @typedef {object} CatalogOffer
 * @property {string} legacyKey
 * @property {string} bitrixId
 * @property {string} productLegacyKey
 * @property {string} title
 * @property {string} configuration
 * @property {string} license
 * @property {string | null} sku
 * @property {CatalogPrice | null} price
 * @typedef {object} Catalog
 * @property {CatalogProduct[]} products
 * @property {CatalogOffer[]} offers
 * @property {CatalogIssue[]} issues
 * @property {{ productsTotal: number, productsActive: number, offersTotal: number, offersActive: number }} stats
 */

/** Колонки списка предложений, которые не являются вариантом комплектации. */
const OFFER_SERVICE_COLUMNS = new Set([
  'ID',
  'Название',
  'Активность',
  'Элемент каталога',
  'Розничная цена',
  'НДС включен в цену',
  'Ставка НДС',
  'Вид лицензии',
  'Срок действия',
  'Детальное описание',
  'Описание для анонса',
  'Детальная картинка',
  'Картинка для анонса',
  'Символьный код',
  'Количество подписок',
  'Элементов',
  'Доступность',
  'Тип товара',
  'Сорт.',
  'Дата создания',
  'Дата изм.',
  'Кем изменена',
  'Кем создана',
  'Вендор',
  'Артикул',
])

/** Свойства товара в CSV называются номерами; названия сверены со списком в админке. */
const PRODUCT_PROPERTIES = { IP_PROP9: 'Артикул', IP_PROP134: 'Важно' }

/** Разделы старого каталога, которые на деле линейки одного производителя. */
const MANUFACTURER_ALIASES = [
  [/canon/i, 'Canon'],
  [/artec/i, 'Artec 3D'],
  [/widetek|image access/i, 'Image Access'],
  [/^autodesk\b/i, 'Autodesk'],
  [/^курсы|^графические рабочие станции$/i, null],
]

// \s в JavaScript включает неразрывный пробел, которым Битрикс отделяет тысячи.
const clean = (value) =>
  String(value ?? '')
    .replace(/\s+/g, ' ')
    .trim()

export const stripHtml = (html) =>
  clean(
    String(html ?? '')
      .replace(/<[^>]+>/g, ' ')
      .replace(/&nbsp;/g, ' ')
      .replace(/&quot;/g, '"')
      .replace(/&amp;/g, '&'),
  )

/** Одно написание производителя на всех товарах: «НТП трубопровод» и «НТП Трубопровод» — один. */
function manufacturerNames(candidates) {
  const counts = new Map()
  for (const name of candidates) counts.set(name, (counts.get(name) ?? 0) + 1)
  const spelling = new Map()
  for (const [name] of [...counts].sort((a, b) => b[1] - a[1]))
    if (!spelling.has(name.toLowerCase())) spelling.set(name.toLowerCase(), name)
  return (name) => {
    if (!name) return null
    const alias = MANUFACTURER_ALIASES.find(([re]) => re.test(name))
    return alias ? alias[1] : (spelling.get(name.toLowerCase()) ?? name)
  }
}

/** Версия из названия предложения: «… ТехПлан (6.x, локальная лицензия)» → «Версия 6.x». */
function versionFromTitle(title) {
  const inner = title.match(/\(([^()]*)\)\s*$/)?.[1] ?? ''
  const first = clean(inner.split(',')[0])
  return /\d/.test(first) && !/год|лет/i.test(first) ? `Версия ${first}` : ''
}

function kindOf(group0, group1) {
  if (group0.startsWith('Аппаратное')) return 'hardware'
  if (group0.startsWith('Услуги')) return /курс/i.test(group1) ? 'course' : 'service'
  return 'software'
}

/** Цена строки списка в формате pricing.mjs, или null с записью о проблеме. */
function priceFields(row, issues, item) {
  const price = parseBitrixPrice(row?.['Розничная цена'])
  if (!price) return null
  if (price.error) {
    issues.push({ type: 'unparsedPrice', ...item, detail: price.error })
    return null
  }
  const problem = priceProblem(price)
  if (problem) {
    const type = problem === 'zero' ? 'zeroPrice' : 'suspiciousPrice'
    issues.push({ type, ...item, detail: row['Розничная цена'] })
    return null
  }
  return {
    amount: price.amount,
    currency: price.currency,
    includesVat: isYes(row['НДС включен в цену']),
    sourceVat: parseVatRate(row['Ставка НДС']),
  }
}

/** CSV каталога даёт строку на каждое значение множественного свойства: склеиваем по ID. */
function mergeProductRows(rows) {
  const byId = new Map()
  for (const row of rows) {
    const id = clean(row.IE_ID)
    const entry = byId.get(id) ?? { row, images: new Set(), related: new Set() }
    for (const image of [row.IE_PREVIEW_PICTURE, row.IE_DETAIL_PICTURE, row.IP_PROP13].map(clean))
      if (image) entry.images.add(image)
    if (clean(row.IP_PROP14)) entry.related.add(clean(row.IP_PROP14))
    byId.set(id, entry)
  }
  return byId
}

function toProduct(id, { row, images, related }, priceRow) {
  const groups = [row.IC_GROUP0, row.IC_GROUP1, row.IC_GROUP2].map(clean).filter(Boolean)
  return {
    legacyKey: `bitrix:product:${id}`,
    bitrixId: id,
    title: clean(row.IE_NAME),
    slug: clean(row.IE_CODE),
    kind: kindOf(groups[0] ?? '', groups[1] ?? ''),
    manufacturer: clean(row.IP_PROP10) || clean(priceRow?.Производитель) || groups[1] || null,
    oldSections: groups,
    summary: stripHtml(row.IE_PREVIEW_TEXT) || null,
    description: htmlToMarkup(row.IE_DETAIL_TEXT) || null,
    images: [...images],
    relatedBitrixIds: [...related],
    properties: Object.entries(PRODUCT_PROPERTIES)
      .map(([column, name]) => ({ name, value: stripHtml(row[column]) }))
      .filter((p) => p.value),
    price: null,
  }
}

function readProducts(merged, productPriceById, issues) {
  const products = []
  const slugs = new Set()
  for (const [id, entry] of merged) {
    if (!isYes(entry.row.IE_ACTIVE)) continue
    const product = toProduct(id, entry, productPriceById.get(id))
    const item = { id, title: product.title }
    if (!product.slug) issues.push({ type: 'noSlug', ...item })
    else if (slugs.has(product.slug))
      issues.push({ type: 'duplicateSlug', ...item, detail: product.slug })
    slugs.add(product.slug)
    products.push(product)
  }
  const canonical = manufacturerNames(products.map((p) => p.manufacturer).filter(Boolean))
  for (const product of products) product.manufacturer = canonical(product.manufacturer)
  return products
}

function toOffer(row, named, issues) {
  const id = clean(row.IE_ID)
  const item = { id, title: clean(row.IE_NAME) }
  if (!named) issues.push({ type: 'offerNotInPrices', ...item })
  const license = [
    named?.['Вид лицензии'] ?? row.IP_PROP90,
    named?.['Срок действия'] ?? row.IP_PROP89,
  ]
    .map(clean)
    .filter(Boolean)
    .join(', ')
  const configuration = Object.entries(named ?? {})
    .filter(([column, value]) => !OFFER_SERVICE_COLUMNS.has(column) && clean(value))
    .map(([, value]) => clean(value))
    .join(', ')
  const price = priceFields(named, issues, item)
  return {
    legacyKey: `bitrix:offer:${id}`,
    bitrixId: id,
    productLegacyKey: `bitrix:product:${clean(row.IP_PROP31)}`,
    title: item.title,
    configuration: configuration || versionFromTitle(item.title) || 'Базовая',
    license: license || '—',
    sku: clean(row.IP_PROP82) || null,
    price,
    noPrice: !price && !!named && !parseBitrixPrice(named['Розничная цена']),
  }
}

function readOffers(offersCsv, merged, activeIds, offerPriceById, issues) {
  const offers = []
  for (const row of offersCsv) {
    if (!isYes(row.IE_ACTIVE)) continue
    const productId = clean(row.IP_PROP31)
    const item = { id: clean(row.IE_ID), title: clean(row.IE_NAME) }
    if (!merged.has(productId))
      issues.push({ type: 'offerOrphan', ...item, detail: productId || 'без привязки' })
    else if (!activeIds.has(productId)) {
      const detail = clean(merged.get(productId).row.IE_NAME)
      issues.push({ type: 'offerProductInactive', ...item, detail })
    } else offers.push(toOffer(row, offerPriceById.get(item.id), issues))
  }
  return offers
}

/** Из двух записей одного варианта лучше та, что с ценой, а из равных — более новая. */
const better = (a, b) =>
  !!a.price !== !!b.price ? !!a.price : Number(a.bitrixId) > Number(b.bitrixId)

/** Разные артикулы с одинаковым описанием — разные варианты: им даём название предложения. */
function labelLookalikes(offers, issues) {
  const sameLook = new Map()
  for (const offer of offers) {
    const look = `${offer.productLegacyKey}|${offer.configuration}|${offer.license}`
    sameLook.set(look, [...(sameLook.get(look) ?? []), offer])
  }
  for (const group of sameLook.values()) {
    if (group.length < 2) continue
    for (const offer of group) {
      offer.configuration = offer.title
      issues.push({
        type: 'ambiguousVariant',
        id: offer.bitrixId,
        title: offer.title,
        detail: offer.sku ?? '',
      })
    }
  }
}

/**
 * В Битриксе один и тот же вариант часто заведён дважды: старое и новое предложение с одним
 * артикулом. Повтором считаем совпадение артикула и лицензии (без артикула — комплектации).
 * Один артикул на разных сроках встречается по ошибке: такие предложения не склеиваем.
 */
function dedupeOffers(candidates, issues) {
  const kept = new Map()
  for (const offer of candidates) {
    const key = `${offer.productLegacyKey}|${offer.license}|${offer.sku ?? offer.configuration}`
    const previous = kept.get(key)
    const [winner, loser] =
      !previous || better(offer, previous) ? [offer, previous] : [previous, offer]
    if (loser)
      issues.push({
        type: 'duplicateVariant',
        id: loser.bitrixId,
        title: loser.title,
        detail: loser.sku ?? '',
      })
    kept.set(key, winner)
  }
  const offers = [...kept.values()]
  labelLookalikes(offers, issues)
  return offers.map(({ noPrice, ...offer }) => {
    if (noPrice) issues.push({ type: 'offerNoPrice', id: offer.bitrixId, title: offer.title })
    return offer
  })
}

/**
 * @param {{ productsCsv: Rows, offersCsv: Rows, offerPrices?: Rows, productPrices?: Rows }} input
 * @returns {Catalog}
 */
export function buildCatalog({ productsCsv, offersCsv, offerPrices = [], productPrices = [] }) {
  const issues = []
  const productPriceById = new Map(productPrices.map((r) => [clean(r.ID), r]))
  const offerPriceById = new Map(offerPrices.map((r) => [clean(r.ID), r]))
  const merged = mergeProductRows(productsCsv)
  const products = readProducts(merged, productPriceById, issues)
  const activeIds = new Set(products.map((p) => p.bitrixId))
  const candidates = readOffers(offersCsv, merged, activeIds, offerPriceById, issues)
  const offers = dedupeOffers(candidates, issues)

  // Простые товары без предложений: цена берётся из самой карточки.
  const withOffers = new Set(offers.map((o) => o.productLegacyKey))
  for (const product of products) {
    const row = productPriceById.get(product.bitrixId)
    if (withOffers.has(product.legacyKey) || !row || /^\s*от\s/.test(row['Розничная цена'] ?? ''))
      continue
    product.price = priceFields(row, issues, { id: product.bitrixId, title: product.title })
  }
  const stats = {
    productsTotal: merged.size,
    productsActive: products.length,
    offersTotal: offersCsv.length,
    offersActive: offersCsv.filter((r) => isYes(r.IE_ACTIVE)).length,
  }
  return { products, offers, issues, stats }
}
