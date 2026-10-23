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
 *   pins?: number[], icon?: string | null, children?: MenuSection[] }} MenuSection
 * @typedef {{ id: number, title: string, main: number | null, sections: number[], href: string,
 *   rank?: number, vendor?: number | null, line?: number | null, lineOrder?: number | null,
 *   group?: string }} MenuProduct
 * @typedef {{ title: string, href: string }} MenuLinkData
 * @typedef {{ key: string, title: string, links: MenuLinkData[], more: boolean, allHref: string }} MenuLineData
 * @typedef {{ key: string, title: string, allHref: string, lines: MenuLineData[] }} MenuVendorData
 * @typedef {{ title: string, icon: string | null, allHref: string, vendors: MenuVendorData[] }} MenuColumnData
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
        // Порядок до линеек: «основной раздел выше» решает между товарами одного уровня.
        .sort(compareInSection(section.id, section.pins ?? []))
      const vendorCards = (
        /** @type {typeof inSection} */ list,
        /** @type {Record<string, string>} */ base = filter,
      ) =>
        vendorTree(list, lines, vendorTitles, section.pins ?? []).map((vendor) => {
          const vendorFilter = vendor.key === OTHER ? base : { ...base, vendor: vendor.title }
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
        })
      // Подразделы («Плоттеры», «Расходные материалы») — первым шагом, как плитки в каталоге
      // (решение владельца 23.10.2026: меню и каталог устроены одинаково).
      const children = (section.children ?? []).flatMap((child) => {
        const inChild = inSection.filter((product) => product.sections.includes(child.id))
        if (!inChild.length) return []
        const childFilter = { group: section.menuGroup, type: child.slug }
        const cards = vendorCards(inChild, childFilter)
        return [
          {
            key: `section:${child.slug}`,
            title: child.title,
            allHref: hrefFor(childFilter),
            // Один производитель — его линейки; несколько — по линейке на производителя.
            lines:
              cards.length === 1
                ? (cards[0]?.lines ?? [])
                : cards.map((card) => ({
                    key: card.key,
                    title: card.title,
                    links: card.lines.flatMap((line) => line.links).slice(0, limit),
                    more: card.lines.some((line) => line.more) || card.lines.length > 1,
                    allHref: card.allHref,
                  })),
          },
        ]
      })
      const inChildren = new Set(
        (section.children ?? []).flatMap((child) =>
          inSection.filter((p) => p.sections.includes(child.id)).map((p) => p.id),
        ),
      )
      const vendors =
        children.length > 1
          ? [...children, ...vendorCards(inSection.filter((p) => !inChildren.has(p.id)))]
          : vendorCards(inSection)
      return {
        title: section.title,
        icon: section.icon ?? null,
        allHref: hrefFor(filter),
        vendors,
      }
    })
    .filter((column) => column.vendors.length > 0)
}
