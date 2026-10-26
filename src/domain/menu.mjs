/**
 * Мегаменю и мобильное меню каталога: чистые функции без базы.
 * Путь как в каталоге на главной: раздел → производитель → линейка → товары
 * (src/domain/catalogTree.mjs). В списке товаров линейки — не больше MENU_LINKS, остальные по ссылке
 * «Смотреть все» в каталог, иначе меню на каждой странице весило бы сотни килобайт.
 */

import { programLogo } from './cardLogos.mjs'
import { OTHER, vendorTree } from './catalogTree.mjs'
import { COURSE_TOPICS, OTHER_TOPIC, topicOrder } from './courseTopics.mjs'
import { familyTaskHref } from './familyGroups.mjs'
import { compareInSection } from './priority.mjs'

/** Товаров линейки в меню, дальше — «Смотреть все» в каталоге. */
export const MENU_LINKS = 12

/**
 * «Популярное в разделе» под плитками производителей: первые товары раздела по приоритету
 * (замечание владельца 27.10.2026: в «Сметах» две плитки и пустая половина меню).
 */
export const MENU_POPULAR = 6

/** Раздел «Обучение»: курсы в меню — по категориям, как в каталоге (src/domain/courseTopics.mjs). */
export const TRAINING = 'training'

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
 *   group?: string, topic?: string }} MenuProduct
 * @typedef {{ url: string, width: number, height: number, local?: boolean }} MenuLogo
 * @typedef {{ title: string, href: string, logo?: MenuLogo | null }} MenuLinkData
 * @typedef {{ key: string, title: string, links: MenuLinkData[], more: boolean, allHref: string }} MenuLineData
 * @typedef {{ key: string, title: string, allHref: string, lines: MenuLineData[],
 *   logo: MenuLogo | null, icon: string | null }} MenuVendorData
 * @typedef {{ title: string, icon: string | null, allHref: string, vendors: MenuVendorData[],
 *   popular: MenuLinkData[] }} MenuColumnData
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
 * @param {Map<string, MenuLogo>} [logos] логотипы производителей по названию — те же, что
 *   у плиток производителей в каталоге (меню и каталог выглядят одинаково)
 * @returns {MenuColumnData[]}
 */
export function menuColumns(
  sections,
  products,
  lines,
  vendorTitles,
  hrefFor,
  limit = MENU_LINKS,
  logos = new Map(),
) {
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
            logo: vendor.key === OTHER ? null : (logos.get(vendor.title) ?? null),
            icon: null,
            allHref: hrefFor(vendorFilter),
            lines: vendor.lines.map((line) => ({
              key: line.key,
              title: line.title,
              links: line.items.slice(0, limit).map((product) => ({
                title: menuTitle(product.title),
                href: familyTaskHref(product.href, filter.direction),
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
            logo: null,
            icon: child.icon ?? null,
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
        section.slug === TRAINING
          ? topicCards(inSection, filter, hrefFor, limit)
          : children.length > 1
            ? [...children, ...vendorCards(inSection.filter((p) => !inChildren.has(p.id)))]
            : vendorCards(inSection)
      return {
        title: section.title,
        icon: section.icon ?? null,
        allHref: hrefFor(filter),
        vendors,
        // Курсы и так видны категориями; у разделов с подразделами — свои плитки; один
        // производитель — меню сразу показывает его товары.
        popular:
          section.slug === TRAINING || children.length || vendors.length < 2
            ? []
            : inSection.slice(0, MENU_POPULAR).map((product) => {
                // Логотип у каждой строки — программы (AutoCAD, Revit), иначе производителя: даже
                // без языка видно, что это отдельные товары и чьи они (замечание владельца 27.10.2026).
                const vendor =
                  product.vendor == null ? null : (vendorTitles.get(product.vendor) ?? null)
                return {
                  title: menuTitle(product.title),
                  href: familyTaskHref(product.href, filter.direction),
                  logo:
                    programLogo({ title: product.title, vendor }) ??
                    (vendor ? (logos.get(vendor) ?? null) : null),
                }
              }),
      }
    })
    .filter((column) => column.vendors.length > 0)
}

/**
 * Курсы раздела «Обучение» карточками категорий: значок и название категории, внутри — курсы.
 * @param {MenuProduct[]} courses
 * @param {Record<string, string>} filter
 * @param {(filter: Record<string, string>) => string} hrefFor
 * @param {number} limit
 * @returns {MenuVendorData[]}
 */
function topicCards(courses, filter, hrefFor, limit) {
  /** @type {Map<string, MenuProduct[]>} */
  const byTopic = new Map()
  for (const course of courses) {
    const key = course.topic ?? OTHER_TOPIC.key
    byTopic.set(key, [...(byTopic.get(key) ?? []), course])
  }
  const all = [...COURSE_TOPICS, OTHER_TOPIC]
  return [...byTopic]
    .sort(([a], [b]) => topicOrder(a) - topicOrder(b))
    .map(([key, list]) => {
      const topic = all.find((item) => item.key === key) ?? OTHER_TOPIC
      const sorted = [...list].sort((a, b) =>
        a.title.localeCompare(b.title, 'ru', { numeric: true }),
      )
      return {
        key: `topic:${key}`,
        title: topic.title,
        logo: null,
        icon: topic.icon,
        allHref: hrefFor(filter),
        lines: [
          {
            key,
            title: topic.title,
            links: sorted.slice(0, limit).map((course) => ({
              title: menuTitle(course.title),
              href: course.href,
            })),
            more: sorted.length > limit,
            allHref: hrefFor(filter),
          },
        ],
      }
    })
}
