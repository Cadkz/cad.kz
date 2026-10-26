/**
 * Полки каталога (пробная ветка redesign/catalog-v2): обзор разделов с примерами программ и
 * товары раздела группами по производителям сразу, без отдельного шага «выберите производителя».
 * Чистые функции без React: проверяются тестами (tests/catalogShelves.test.mjs).
 */

import { catalogKind, collectionOf, memberName, shortTitle } from '../domain/catalogKinds.mjs'
import { compareInSection } from '../domain/priority.mjs'
import type { CatalogGroup, CatalogItem, CatalogLine, Facet } from './catalog'
import {
  emptyFilter,
  type FilterState,
  facetOptions,
  fromSearch,
  groupedResults,
  matches,
} from './catalogFilter'
import { positions } from './plural'

/** Плитка раздела на обзоре каталога: что внутри — названиями, а не «Смотреть». */
export type ShelfTile = {
  slug: string
  title: string
  summary: string | null
  icon: string | null
  group: CatalogGroup
  /** Направление программ или тип оборудования и услуг: от этого параметр адреса. */
  isDirection: boolean
  count: number
  /** Первые программы или модели раздела, коротко: «АВС-KZ, АВС АККОРД, Takeoff». */
  examples: string[]
}

const EXAMPLES = 3
const MINOR_KINDS = new Set(['Расходный материал', 'Ключ защиты', 'Обновление'])

const sectionState = (facet: Pick<Facet, 'slug' | 'group' | 'isDirection'>): FilterState =>
  facet.isDirection
    ? { ...emptyFilter, group: 'software', direction: facet.slug }
    : { ...emptyFilter, group: facet.group, type: facet.slug }

/** Выбор, который открывает раздел плитки: направление программ или тип оборудования и услуг. */
export const tileState = (tile: ShelfTile) => sectionState(tile)

/** Товары раздела в порядке каталога: топы продаж, производители раздела, остальное. */
export function sectionItems(items: CatalogItem[], facets: Facet[], state: FilterState) {
  const section = state.type ?? state.direction
  const pins = facets.find((facet) => facet.slug === section)?.pins ?? []
  return items.filter((item) => matches(item, state)).sort(compareInSection(section, pins))
}

/** Плитки обзора по группам: программы по задачам, оборудование, обучение и услуги. */
export function landingShelves(items: CatalogItem[], facets: Facet[]) {
  const tile = (facet: Facet): ShelfTile => {
    const list = sectionItems(items, facets, sectionState(facet))
    // В примерах — сами устройства и программы, не картриджи и ключи защиты.
    const main = list.filter((item) => !MINOR_KINDS.has(catalogKind(item)))
    const examples = [
      ...new Set((main.length ? main : list).map((i) => shortTitle(i.title))),
    ].slice(0, EXAMPLES)
    return {
      slug: facet.slug,
      title: facet.title,
      summary: facet.summary ?? null,
      icon: facet.icon ?? null,
      group: facet.group,
      isDirection: facet.isDirection,
      count: list.length,
      examples,
    }
  }
  const of = (group: CatalogGroup, directions: boolean) =>
    facets
      .filter((f) => f.group === group && f.isDirection === directions && !f.parent)
      .map(tile)
      .filter((entry) => entry.count > 0)
  return {
    software: of('software', true),
    hardware: of('hardware', false),
    service: of('service', false),
  }
}

/** Полка раздела: производитель или подраздел со своими карточками. */
export type Shelf = {
  key: string
  title: string
  /** Чем полка уточняет выбор: производитель (vendors) или подраздел (type). */
  pick: Partial<FilterState>
  items: CatalogItem[]
}

/**
 * Полки открытого раздела. Раздел с подразделами («Широкоформатные плоттеры») — по подразделам
 * («Плоттеры», «Расходные материалы»), иначе по производителям в порядке фильтра (сначала
 * «Первыми в разделе», потом топы продаж). Товары без производителя — последней полкой без
 * заголовка.
 */
export function sectionShelves(items: CatalogItem[], facets: Facet[], state: FilterState): Shelf[] {
  const list = sectionItems(items, facets, state)
  const children = state.type ? facets.filter((facet) => facet.parent === state.type) : []
  if (children.length) {
    return children
      .map((child) => ({
        key: child.slug,
        title: child.title,
        pick: { type: child.slug },
        items: list.filter((item) => item.types.includes(child.slug)),
      }))
      .filter((shelf) => shelf.items.length > 0)
  }
  const order = facetOptions(items, facets, state).vendors.map((option) => option.value)
  const shelves: Shelf[] = order
    .map((vendor) => ({
      key: vendor,
      title: vendor,
      pick: { vendors: [vendor] },
      items: list.filter((item) => item.vendor === vendor),
    }))
    .filter((shelf) => shelf.items.length > 0)
  const rest = list.filter((item) => !item.vendor)
  if (rest.length) shelves.push({ key: 'other', title: '', pick: {}, items: rest })
  return shelves
}

/** Что в карточке под названием: тип позиции и состав линейки или коллекции. */
export type CardInfo = {
  kind: string
  /** «Входит: Revit, AutoCAD, Civil 3D и ещё 10» — у коллекций и линеек. */
  includes: { names: string[]; total: number } | null
}

const INCLUDES_SHOWN = 3

/** Подпись и состав карточки. Программы линейки берутся из того же списка каталога. */
export function cardInfo(item: CatalogItem, items: CatalogItem[]): CardInfo {
  const kind = catalogKind(item)
  const collection = collectionOf(item.title)
  if (collection)
    return {
      kind,
      includes: {
        names: collection.contents.slice(0, INCLUDES_SHOWN).map((entry) => entry.name),
        total: collection.contents.length,
      },
    }
  if (item.scope === 'family' && item.line) {
    const members = items.filter(
      (other) => other.line === item.line && other.scope !== 'family' && other.id !== item.id,
    )
    const names = [...new Set(members.map((member) => memberName(member.title, item.title)))]
    return {
      kind,
      includes: members.length
        ? { names: names.slice(0, INCLUDES_SHOWN), total: members.length }
        : null,
    }
  }
  return { kind, includes: null }
}

/** Состав коллекции для страницы товара: пункт со своей страницей в каталоге — ссылкой. */
export function collectionContents(
  title: string,
  items: Pick<CatalogItem, 'title' | 'href' | 'scope'>[],
) {
  const collection = collectionOf(title)
  if (!collection) return null
  const byTitle = new Map(
    items
      .filter((item) => item.scope === 'all')
      .map((item) => [item.title.toLowerCase(), item.href]),
  )
  return {
    lead: collection.lead,
    benefit: collection.benefit,
    contents: collection.contents.map((entry) => ({
      name: entry.name,
      href: ('title' in entry && entry.title && byTitle.get(entry.title.toLowerCase())) || null,
    })),
  }
}

/** Плитка «Популярных решений» карточкой каталога. Подборка без своего товара — с числом позиций. */
export type PopularEntry = { item: CatalogItem; info: CardInfo; note: string | null }

type PopularSource = { key: string; title: string; href: string; picture: CatalogItem['picture'] }

/**
 * «Популярные решения» из админки — теми же карточками, что весь каталог (раньше — плитки
 * другого вида, замечание владельца 26.10.2026). Плитка товара — его карточка; плитка-подборка
 * («3D-сканеры Artec» ведёт в раздел, «Fusion» — в поиск) — карточка с первыми позициями.
 */
export function popularEntries(
  popular: PopularSource[],
  items: CatalogItem[],
  facets: Facet[],
): PopularEntry[] {
  const listed = items.filter((item) => item.scope === 'all' || item.scope === 'family')
  const byHref = new Map(listed.map((item) => [item.href, item]))
  return popular.flatMap((card, index): PopularEntry[] => {
    const found = byHref.get(card.href)
    if (found) return [{ item: found, info: cardInfo(found, items), note: null }]
    const [path, query = ''] = card.href.split('?')
    const members =
      path === '/catalog'
        ? sectionItems(items, facets, fromSearch(query))
        : listed.filter((item) => item.title.toLowerCase().includes(card.title.toLowerCase()))
    const [first] = members
    if (!first) return []
    const names = [...new Set(members.map((item) => shortTitle(item.title)))]
    // Производитель подборки — только если он у всех позиций один.
    const vendors = new Set(members.map((item) => item.vendor))
    const vendor = vendors.size === 1 ? first.vendor : null
    return [
      {
        item: {
          ...first,
          id: -1_000_000 - index,
          href: card.href,
          title: card.title,
          vendor,
          manufacturer: vendor,
          picture: card.picture ?? first.picture,
          summary:
            names.slice(0, INCLUDES_SHOWN).join(', ') + (names.length > INCLUDES_SHOWN ? '…' : ''),
          priceFrom: null,
          offersCount: 0,
          cartOfferId: null,
          badge: null,
          lifecycle: null,
        },
        info: { kind: 'Подборка', includes: null },
        note: positions(members.length),
      },
    ]
  })
}

/** Плашка над товарами раздела: подраздел или производитель. */
export type SectionChip = {
  key: string
  label: string
  selected: boolean
  pick: Partial<FilterState>
}

/** Плашки подразделов («Плоттеры», «Расходные материалы»), если они есть у раздела. */
function childChips(
  items: CatalogItem[],
  facets: Facet[],
  head: Facet,
  state: FilterState,
): SectionChip[] {
  // Пустой подраздел плашкой не показываем: щелчок по нему дал бы пустой экран.
  const children = facets.filter(
    (entry) =>
      entry.parent === head.slug &&
      sectionItems(items, facets, { ...state, type: entry.slug, vendors: [] }).length > 0,
  )
  if (children.length < 2) return []
  return [
    { key: 'all', label: 'Все', selected: state.type === head.slug, pick: { type: head.slug } },
    ...children.map((child) => ({
      key: child.slug,
      label: child.title,
      selected: state.type === child.slug,
      pick: { type: child.slug },
    })),
  ]
}

/** Плашки производителей раздела, если их больше одного. */
function vendorChips(items: CatalogItem[], facets: Facet[], state: FilterState): SectionChip[] {
  const all = sectionShelves(items, facets, { ...state, vendors: [], tasks: [], features: {} })
  const named = all.filter((shelf) => shelf.title)
  if (named.length < 2) return []
  return [
    { key: 'all', label: 'Все', selected: !state.vendors.length, pick: { vendors: [] } },
    ...named.map((shelf) => ({
      key: shelf.key,
      label: shelf.title,
      selected: state.vendors.includes(shelf.key),
      pick: shelf.pick,
    })),
  ]
}

/**
 * Что показать в открытом разделе: заголовок (у подраздела — родитель), плашки и сами товары.
 * Выбраны задачи или характеристики — общий список (flat); выбран один производитель — его
 * позиции по линейкам (groups); иначе — полки по производителям или подразделам (shelves).
 */
export function sectionView(
  items: CatalogItem[],
  facets: Facet[],
  lines: CatalogLine[],
  state: FilterState,
) {
  const facet = facets.find((entry) => entry.slug === (state.type ?? state.direction))
  const head = (facet?.parent && facets.find((entry) => entry.slug === facet.parent)) || facet
  const sub = head ? childChips(items, facets, head, state) : []
  const chips = sub.length ? sub : vendorChips(items, facets, state)
  const narrowed =
    state.tasks.length > 0 || Object.values(state.features).some((values) => values.length)
  const flat = narrowed ? sectionItems(items, facets, state) : null
  const groups = !flat && state.vendors.length === 1 ? groupedResults(items, state, lines) : null
  const shelves = flat || groups ? [] : sectionShelves(items, facets, state)
  const count = (list: { items: unknown[] }[]) => list.reduce((sum, g) => sum + g.items.length, 0)
  return {
    head: head ?? null,
    chipsAre: sub.length ? ('Подраздел' as const) : ('Производитель' as const),
    chips,
    flat,
    groups,
    shelves,
    total: flat?.length ?? (groups ? count(groups) : count(shelves)),
  }
}
