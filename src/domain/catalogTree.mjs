/**
 * Путь по каталогу «раздел → производитель → линейка → товары» (решение владельца 09.10.2026).
 * Чистые функции без базы: одни и те же для мегаменю, мобильного меню и каталога на главной.
 *
 * Производители раздела: сначала «Первыми в разделе» по порядку, потом по уровню приоритета
 * лучшего товара, потом по названию. Товары без производителя — в конце, группой «Другие».
 * Линейки — по полю «Порядок», товары без линейки у производителя с линейками — последней группой
 * «Другие программы». Товары внутри линейки: «Порядок в линейке» (основа первой), потом уровень
 * приоритета, потом название.
 */

/** Ключ группы для товаров без производителя или без линейки. */
export const OTHER = 'other'
/** Подпись группы товаров без линейки. */
export const OTHER_LINE_TITLE = 'Другие программы'
/** Подпись группы товаров без производителя. */
export const OTHER_VENDOR_TITLE = 'Другие производители'

/**
 * Производитель и линейка задаются ключом: id из базы (меню) или название и строковый id (каталог
 * в браузере).
 * @typedef {number | string} Key
 * @typedef {{ title: string, vendor: Key | null, rank: number, line: Key | null,
 *   lineOrder: number | null }} TreeProduct
 * @typedef {{ id: Key, title: string, vendor: Key, order: number }} TreeLine
 * @typedef {{ key: string, title: string, items: TreeProduct[] }} LineNode
 * @typedef {{ key: string, title: string, lines: LineNode[] }} VendorNode
 */

/**
 * Сравнение товаров внутри линейки.
 * @param {TreeProduct} a
 * @param {TreeProduct} b
 */
export function compareInLine(a, b) {
  const order = (/** @type {TreeProduct} */ item) => item.lineOrder ?? Number.MAX_SAFE_INTEGER
  return (
    order(a) - order(b) ||
    b.rank - a.rank ||
    a.title.localeCompare(b.title, 'ru', { numeric: true })
  )
}

/**
 * Производители и их линейки для товаров одного раздела.
 * @template {TreeProduct} T
 * @param {T[]} products товары раздела
 * @param {TreeLine[]} lines все линейки
 * @param {Map<Key, string>} vendorTitles названия производителей
 * @param {Key[]} [pins] «Первыми в разделе»
 * @returns {{ key: string, title: string, lines: { key: string, title: string, items: T[] }[] }[]}
 */
export function vendorTree(products, lines, vendorTitles, pins = []) {
  /** @type {Map<Key | null, T[]>} */
  const byVendor = new Map()
  for (const product of products) {
    const vendor =
      product.vendor != null && vendorTitles.has(product.vendor) ? product.vendor : null
    byVendor.set(vendor, [...(byVendor.get(vendor) ?? []), product])
  }
  const best = (/** @type {T[]} */ items) => Math.max(...items.map((item) => item.rank))
  const pinIndex = (/** @type {Key | null} */ vendor) => {
    const index = vendor == null ? -1 : pins.indexOf(vendor)
    return index === -1 ? pins.length : index
  }
  const vendors = [...byVendor.keys()].sort((a, b) => {
    if (a == null || b == null) return Number(a == null) - Number(b == null)
    const itemsA = byVendor.get(a) ?? []
    const itemsB = byVendor.get(b) ?? []
    return (
      pinIndex(a) - pinIndex(b) ||
      best(itemsB) - best(itemsA) ||
      (vendorTitles.get(a) ?? '').localeCompare(vendorTitles.get(b) ?? '', 'ru')
    )
  })
  return vendors.map((vendor) => {
    const items = byVendor.get(vendor) ?? []
    const own = lines
      .filter((line) => line.vendor === vendor)
      .sort((a, b) => a.order - b.order || a.title.localeCompare(b.title, 'ru'))
    const groups = own
      .map((line) => ({
        key: String(line.id),
        title: line.title,
        items: items.filter((item) => item.line === line.id).sort(compareInLine),
      }))
      .filter((group) => group.items.length > 0)
    const known = new Set(groups.map((group) => group.key))
    const rest = items.filter((item) => item.line == null || !known.has(String(item.line)))
    if (rest.length)
      groups.push({
        key: OTHER,
        title: groups.length
          ? OTHER_LINE_TITLE
          : vendor == null
            ? ''
            : (vendorTitles.get(vendor) ?? ''),
        items: rest.sort(compareInLine),
      })
    return {
      key: vendor == null ? OTHER : String(vendor),
      title: vendor == null ? OTHER_VENDOR_TITLE : (vendorTitles.get(vendor) ?? ''),
      lines: groups,
    }
  })
}
