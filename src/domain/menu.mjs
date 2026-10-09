/**
 * Колонки мегаменю каталога: чистые функции без базы.
 * В колонке раздела — не больше MENU_LINKS товаров и ссылка «Все N» на каталог с этим разделом,
 * иначе при сотнях товаров меню не помещается в экран. Порядок — по приоритету показа
 * (src/domain/priority.mjs): флагманы и топы продаж первыми, производители в порядке раздела,
 * потом товары с этим основным разделом, потом по названию. От одного производителя в колонке
 * сначала не больше двух товаров, чтобы после GEO5 были видны ЛИРА и SCAD.
 */
import { compareInSection, pickVaried } from './priority.mjs'

/** Товаров раздела в мегаменю: показывается один раздел за раз, места на две колонки. */
export const MENU_LINKS = 8
/** От одного производителя в разделе меню сначала не больше стольких товаров. */
export const MENU_PER_VENDOR = 3

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
 *   rank?: number, vendor?: number | null, vendorTitle?: string | null }} MenuProduct
 * @typedef {{ title: string, href: string, vendor: string | null }} MenuLinkData
 * @typedef {{ title: string, icon: string | null, links: MenuLinkData[], total: number,
 *   allHref: string }} MenuColumnData
 */

/**
 * Фильтр каталога для раздела: направление у программ, тип у оборудования и услуг.
 * Направление без группы: в него входят и сканеры, и курсы этой отрасли — как и в счётчике «Все N».
 * @param {MenuSection} section
 * @returns {Record<string, string>}
 */
export function sectionFilter(section) {
  return section.isDirection
    ? { direction: section.slug }
    : { group: section.menuGroup, type: section.slug }
}

/**
 * @param {MenuSection[]} sections разделы одной группы меню в порядке вывода
 * @param {MenuProduct[]} products опубликованные товары
 * @param {(filter: Record<string, string>) => string} hrefFor адрес каталога по фильтру
 * @param {number} [limit]
 * @returns {MenuColumnData[]}
 */
export function menuColumns(sections, products, hrefFor, limit = MENU_LINKS) {
  return sections
    .map((section) => {
      const inSection = products
        .filter((product) => product.sections.includes(section.id))
        .map((product) => ({ ...product, rank: product.rank ?? 1, vendor: product.vendor ?? null }))
        .sort(compareInSection(section.id, section.pins ?? []))
      return {
        title: section.title,
        icon: section.icon ?? null,
        links: pickVaried(inSection, limit, MENU_PER_VENDOR).map((product) => ({
          title: menuTitle(product.title),
          href: product.href,
          vendor: product.vendorTitle ?? null,
        })),
        total: inSection.length,
        allHref: hrefFor(sectionFilter(section)),
      }
    })
    .filter((column) => column.total > 0)
}
