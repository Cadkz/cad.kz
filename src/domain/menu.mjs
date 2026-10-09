/**
 * Колонки мегаменю каталога: чистые функции без базы.
 * В колонке раздела — не больше MENU_LINKS товаров и ссылка «Все N» на каталог с этим разделом,
 * иначе при сотнях товаров меню не помещается в экран. Сначала товары, у которых раздел основной,
 * потом остальные; внутри — по названию.
 */

export const MENU_LINKS = 5

/**
 * @typedef {{ id: number, slug: string, title: string, menuGroup: string, isDirection: boolean }} MenuSection
 * @typedef {{ id: number, title: string, main: number | null, sections: number[], href: string }} MenuProduct
 * @typedef {{ title: string, links: { title: string, href: string }[], total: number, allHref: string }} MenuColumnData
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
        .sort(
          (a, b) =>
            Number(b.main === section.id) - Number(a.main === section.id) ||
            a.title.localeCompare(b.title, 'ru', { numeric: true }),
        )
      return {
        title: section.title,
        links: inSection.slice(0, limit).map(({ title, href }) => ({ title, href })),
        total: inSection.length,
        allHref: hrefFor(sectionFilter(section)),
      }
    })
    .filter((column) => column.total > 0)
}
