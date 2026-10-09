/**
 * Мегаменю и мобильное меню каталога: чистые функции без базы.
 * Путь как в каталоге на главной: раздел → производитель → линейка → товары
 * (src/domain/catalogTree.mjs). В списке товаров линейки — не больше MENU_LINKS, остальные по ссылке
 * «Смотреть все» в каталог, иначе меню на каждой странице весило бы сотни килобайт.
 */
import { OTHER, vendorTree } from './catalogTree.mjs'
import { compareInSection } from './priority.mjs'

/** Товаров линейки в меню, дальше — «Смотреть все» в каталоге. */
export const MENU_LINKS = 12

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
 * @typedef {{ id: number, slug: string, title: string, menuGroup: string, isDirection: boolean,
 *   pins?: number[], icon?: string | null }} MenuSection
 * @typedef {{ id: number, title: string, main: number | null, sections: number[], href: string,
 *   rank?: number, vendor?: number | null, line?: number | null, lineOrder?: number | null }} MenuProduct
 * @typedef {{ title: string, href: string }} MenuLinkData
 * @typedef {{ key: string, title: string, links: MenuLinkData[], more: boolean, allHref: string }} MenuLineData
 * @typedef {{ key: string, title: string, allHref: string, lines: MenuLineData[] }} MenuVendorData
 * @typedef {{ title: string, icon: string | null, allHref: string, vendors: MenuVendorData[] }} MenuColumnData
 */

/**
 * Фильтр каталога для раздела: направление у программ, тип у оборудования и услуг.
 * Направление без группы: в него входят и сканеры, и курсы этой отрасли.
 * @param {MenuSection} section
 * @returns {Record<string, string>}
 */
export function sectionFilter(section) {
  return section.isDirection
    ? { direction: section.slug }
    : { group: section.menuGroup, type: section.slug }
}

/**
 * Разделы одной группы меню с производителями, линейками и товарами.
 * @param {MenuSection[]} sections разделы группы в порядке вывода
 * @param {MenuProduct[]} products опубликованные товары
 * @param {{ id: number, title: string, vendor: number, order: number }[]} lines линейки
 * @param {Map<number, string>} vendorTitles
 * @param {(filter: Record<string, string>) => string} hrefFor адрес каталога по фильтру
 * @param {number} [limit]
 * @returns {MenuColumnData[]}
 */
export function menuColumns(sections, products, lines, vendorTitles, hrefFor, limit = MENU_LINKS) {
  return sections
    .map((section) => {
      const filter = sectionFilter(section)
      const inSection = products
        .filter((product) => product.sections.includes(section.id))
        .map((product) => ({
          ...product,
          rank: product.rank ?? 1,
          vendor: product.vendor ?? null,
          line: product.line ?? null,
          lineOrder: product.lineOrder ?? null,
        }))
        // Порядок до линеек: «основной раздел выше» решает между товарами одного уровня.
        .sort(compareInSection(section.id, section.pins ?? []))
      const vendors = vendorTree(inSection, lines, vendorTitles, section.pins ?? []).map(
        (vendor) => {
          const vendorFilter = vendor.key === OTHER ? filter : { ...filter, vendor: vendor.title }
          return {
            key: vendor.key,
            title: vendor.title,
            allHref: hrefFor(vendorFilter),
            lines: vendor.lines.map((line) => ({
              key: line.key,
              title: line.title,
              links: line.items.slice(0, limit).map((product) => ({
                title: menuTitle(product.title),
                href: product.href,
              })),
              more: line.items.length > limit,
              allHref: hrefFor(
                line.key === OTHER ? vendorFilter : { ...vendorFilter, line: line.key },
              ),
            })),
          }
        },
      )
      return {
        title: section.title,
        icon: section.icon ?? null,
        allHref: hrefFor(filter),
        vendors,
      }
    })
    .filter((column) => column.vendors.length > 0)
}
