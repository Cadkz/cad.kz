/**
 * Мегаменю и мобильное меню каталога: чистые функции без базы.
 * Вариант А (решение владельца 13.10.2026): раздел по задаче → сразу программы раздела, без шага
 * с производителями. Производители раздела — строкой ссылок под программами, все производители —
 * отдельной вкладкой. В разделе не больше MENU_LINKS программ, остальные — «Все программы раздела»
 * в каталоге, иначе меню на каждой странице весило бы сотни килобайт.
 */
import { OTHER, vendorTree } from './catalogTree.mjs'
import { compareInSection, pickVaried } from './priority.mjs'

/** Программ раздела в меню, дальше — «Все программы раздела» в каталоге. */
export const MENU_LINKS = 12
/** Сколько программ одного производителя подряд: 40 модулей GEO5 не займут весь раздел. */
export const MENU_PER_VENDOR = 4
/** Программ в подсказке под производителем во вкладке «Производители». */
export const VENDOR_HINT = 3

/**
 * Короткое название для меню: без канцелярского «Право на использование программного
 * обеспечения», с которого в Битриксе начинаются сотни товаров CSoft и Chaos.
 * @param {string} title
 */
export function menuTitle(title) {
  const short = title
    .replace(/^право на использование (программного обеспечения|ПО)\s*/i, '')
    .trim()
  return short ? short[0].toUpperCase() + short.slice(1) : title
}

/**
 * «КРИСТАЛЛ - экспертиза элементов…» → название и пояснение отдельно.
 * @param {string} title
 * @returns {[string, string | null]}
 */
export function splitTitle(title) {
  const match = title.match(/^(.+?)\s+[-–—]\s+(.+)$/)
  return match ? [match[1], match[2]] : [title, null]
}

/**
 * @typedef {{ id: number, slug: string, title: string, menuGroup: string, isDirection: boolean,
 *   pins?: number[], icon?: string | null }} MenuSection
 * @typedef {{ id: number, title: string, main: number | null, sections: number[], href: string,
 *   rank?: number, vendor?: number | null, line?: number | null, lineOrder?: number | null,
 *   group?: string }} MenuProduct
 * @typedef {{ title: string, note: string | null, vendor: string | null, href: string }} MenuProgramData
 * @typedef {{ title: string, href: string }} MenuLinkData
 * @typedef {{ title: string, icon: string | null, allHref: string, programs: MenuProgramData[],
 *   more: boolean, vendors: MenuLinkData[] }} MenuColumnData
 * @typedef {{ title: string, href: string, hint: string }} MenuVendorData
 */

/**
 * Фильтр каталога для раздела: направление у программ, тип у оборудования и услуг.
 * Направление — раздел программ: курсы и техника этой отрасли в нём не показываются.
 * @param {MenuSection} section
 * @returns {Record<string, string>}
 */
export function sectionFilter(section) {
  return section.isDirection
    ? { direction: section.slug }
    : { group: section.menuGroup, type: section.slug }
}

/**
 * @param {MenuProduct} product
 * @param {Map<number, string>} vendorTitles
 * @returns {MenuProgramData}
 */
function program(product, vendorTitles) {
  const [title, note] = splitTitle(menuTitle(product.title))
  return {
    title,
    note,
    vendor: product.vendor == null ? null : (vendorTitles.get(product.vendor) ?? null),
    href: product.href,
  }
}

/**
 * Разделы одной группы меню: программы раздела по приоритету и производители раздела.
 * @param {MenuSection[]} sections разделы группы в порядке вывода
 * @param {MenuProduct[]} products опубликованные товары
 * @param {Map<number, string>} vendorTitles
 * @param {(filter: Record<string, string>) => string} hrefFor адрес каталога по фильтру
 * @param {number} [limit]
 * @returns {MenuColumnData[]}
 */
export function menuColumns(sections, products, vendorTitles, hrefFor, limit = MENU_LINKS) {
  return sections
    .map((section) => {
      const filter = sectionFilter(section)
      const pins = section.pins ?? []
      const inSection = products
        // Только товары группы раздела: курс с направлением «Инженерные сети» — в «Обучении»,
        // а не среди программ (направление у курса нужно подборкам).
        .filter(
          (product) =>
            product.sections.includes(section.id) &&
            (!product.group || product.group === section.menuGroup),
        )
        .map((product) => ({
          ...product,
          rank: product.rank ?? 1,
          vendor: product.vendor ?? null,
          line: product.line ?? null,
          lineOrder: product.lineOrder ?? null,
        }))
        // Топы продаж первыми, внутри уровня — «Первыми в разделе», потом основной раздел.
        .sort(compareInSection(section.id, pins))
      const shown = pickVaried(inSection, limit, MENU_PER_VENDOR)
      // Порядок производителей — как в каталоге: «Первыми в разделе», потом по лучшему товару.
      const vendors = vendorTree(inSection, [], vendorTitles, pins)
        .filter((vendor) => vendor.key !== OTHER)
        .map((vendor) => ({
          title: vendor.title,
          href: hrefFor({ ...filter, vendor: vendor.title }),
        }))
      return {
        title: section.title,
        icon: section.icon ?? null,
        allHref: hrefFor(filter),
        programs: shown.map((product) => program(product, vendorTitles)),
        more: inSection.length > shown.length,
        // Один производитель — строка ссылок ничего не уточняет.
        vendors: vendors.length > 1 ? vendors : [],
      }
    })
    .filter((column) => column.programs.length > 0)
}

/**
 * Вкладка «Производители»: все производители программ и оборудования, сначала те, у кого топы
 * продаж; под названием — их главные товары. Ссылка — каталог с этим производителем.
 * @param {MenuProduct[]} products опубликованные товары (без услуг)
 * @param {Map<number, string>} vendorTitles
 * @param {(filter: Record<string, string>) => string} hrefFor
 * @returns {MenuVendorData[]}
 */
export function menuVendors(products, vendorTitles, hrefFor) {
  /** @type {Map<number, MenuProduct[]>} */
  const byVendor = new Map()
  for (const product of products) {
    if (product.vendor == null || !vendorTitles.has(product.vendor)) continue
    byVendor.set(product.vendor, [...(byVendor.get(product.vendor) ?? []), product])
  }
  const best = (/** @type {MenuProduct[]} */ items) =>
    Math.max(...items.map((item) => item.rank ?? 1))
  return [...byVendor]
    .map(([vendor, items]) => {
      const title = vendorTitles.get(vendor) ?? ''
      const ranked = items
        .map((item) => ({ ...item, rank: item.rank ?? 1, vendor: item.vendor ?? null }))
        .sort(compareInSection(null, []))
      const hint = [...new Set(ranked.map((item) => splitTitle(menuTitle(item.title))[0]))].slice(
        0,
        VENDOR_HINT,
      )
      return { title, href: hrefFor({ vendor: title }), hint: hint.join(' · '), rank: best(items) }
    })
    .sort((a, b) => b.rank - a.rank || a.title.localeCompare(b.title, 'ru'))
    .map(({ title, href, hint }) => ({ title, href, hint }))
}
