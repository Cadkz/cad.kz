/**
 * Мегаменю и мобильное меню каталога: чистые функции без базы.
 * Вариант А (решение владельца 13.10.2026): раздел по задаче → сразу программы раздела, без шага
 * с производителями. Производителей в меню нет (решение владельца 13.10.2026): производитель виден
 * мелко под названием программы, отбор по производителю — в каталоге. В разделе не больше MENU_LINKS программ, остальные — «Все программы раздела»
 * в каталоге, иначе меню на каждой странице весило бы сотни килобайт.
 */
import { compareInSection, pickVaried } from './priority.mjs'

/** Программ раздела в меню, дальше — «Все программы раздела» в каталоге. */
export const MENU_LINKS = 12
/** Сколько программ одного производителя подряд: 40 модулей GEO5 не займут весь раздел. */
export const MENU_PER_VENDOR = 4

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
 * @typedef {{ title: string, icon: string | null, allHref: string, programs: MenuProgramData[],
 *   more: boolean }} MenuColumnData
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
 * Разделы одной группы меню: программы раздела по приоритету.
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
      return {
        title: section.title,
        icon: section.icon ?? null,
        allHref: hrefFor(filter),
        programs: shown.map((product) => program(product, vendorTitles)),
        more: inSection.length > shown.length,
      }
    })
    .filter((column) => column.programs.length > 0)
}
