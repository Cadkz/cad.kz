/**
 * Каскадный фильтр каталога: чистые функции без React и сервера.
 * Счётчик у значения (на сайте не показывается) — сколько товаров останется, если его выбрать
 * при всех остальных выбранных условиях: по нему скрываются пустые варианты.
 */
import { compareInLine } from '../domain/catalogTree.mjs'
import { compareInSection } from '../domain/priority.mjs'
import type { CatalogGroup, CatalogItem, CatalogLine, Facet } from './catalog'

export type FilterState = {
  group: CatalogGroup | null
  direction: string | null
  type: string | null
  vendors: string[]
  /** Линейка производителя (id строкой): шаг после выбора одного производителя. */
  line: string | null
  tasks: string[]
  page: number
}

type Key = 'group' | 'direction' | 'type' | 'vendors' | 'line' | 'tasks'

export const PAGE_SIZE = 9
export const emptyFilter: FilterState = {
  group: null,
  direction: null,
  type: null,
  vendors: [],
  line: null,
  tasks: [],
  page: 1,
}

const groups: CatalogGroup[] = ['software', 'hardware', 'service']

/** Выбран ровно один производитель: его товары показываются группами по линейкам. */
export const vendorView = (state: FilterState) => state.vendors.length === 1

/** Видна ли карточка при этом выборе (поле scope, src/lib/catalog.ts). */
function visible(item: CatalogItem, state: FilterState, ignore?: Key) {
  // Для счётчиков задач считаем, будто задача уже выбрана: иначе задачи, которые есть только
  // у отдельных программ GEO5, не попали бы в список.
  const tasksOn = state.tasks.length > 0 || ignore === 'tasks'
  switch (item.scope) {
    case 'family':
      return !vendorView(state)
    case 'detail':
      return vendorView(state) || tasksOn
    case 'task':
      return tasksOn
    default:
      return true
  }
}

export function matches(item: CatalogItem, state: FilterState, ignore?: Key) {
  if (!visible(item, state, ignore)) return false
  // Курсы и услуги — только во вкладке «Услуги»: в общем списке и в направлениях программ они
  // занимают место (решение владельца 21.10.2026). Курс к программе — в «С этим покупают».
  if (item.group === 'service' && state.group !== 'service') return false
  if (ignore !== 'group' && state.group && item.group !== state.group) return false
  if (ignore !== 'direction' && state.direction && !item.directions.includes(state.direction))
    return false
  if (ignore !== 'type' && state.type && !item.types.includes(state.type)) return false
  if (ignore !== 'vendors' && state.vendors.length && !state.vendors.includes(item.vendor ?? ''))
    return false
  // «other» — товары производителя без линейки (группа «Другие программы»).
  if (ignore !== 'line' && state.line && item.line !== (state.line === 'other' ? null : state.line))
    return false
  if (ignore !== 'tasks' && state.tasks.length && !item.tasks.some((t) => state.tasks.includes(t)))
    return false
  return true
}

function countBy(items: CatalogItem[], values: (item: CatalogItem) => (string | null)[]) {
  const counts = new Map<string, number>()
  for (const item of items)
    for (const value of new Set(values(item)))
      if (value) counts.set(value, (counts.get(value) ?? 0) + 1)
  return counts
}

export type Option = { value: string; label: string; count: number }

const byLabel = (a: Option, b: Option) => a.label.localeCompare(b.label, 'ru')

/** Ранг, с которого товар считается топом продаж (src/domain/priority.mjs, TOP_BASE). */
const TOP_SALES_RANK = 10

/**
 * Порядок производителей в фильтре (замечание владельца 21.10.2026: SCAD внизу, а Chaos, АРС-ПС
 * и Base вверху). Сначала производители раздела по его порядку («Первыми в разделе»), затем
 * производители топов продаж — как их товары стоят в каталоге (Autodesk, АВС, SCAD, Fine, Artec,
 * CSoft, ЛИРА), остальные по алфавиту. Список товаров с сервера уже упорядочен по приоритету.
 */
function vendorOrder(items: CatalogItem[], pins: string[]) {
  const first = new Map<string, number>()
  items.forEach((item, index) => {
    if (item.vendor && item.rank >= TOP_SALES_RANK && !first.has(item.vendor))
      first.set(item.vendor, index)
  })
  const place = (option: Option) => {
    const pin = pins.indexOf(option.value)
    if (pin !== -1) return pin
    const top = first.get(option.value)
    return top == null ? Number.MAX_SAFE_INTEGER : pins.length + top
  }
  return (a: Option, b: Option) => place(a) - place(b) || byLabel(a, b)
}

/** Варианты всех групп фильтра для текущего выбора. Пустые варианты скрыты, выбранные — нет. */
export function facetOptions(items: CatalogItem[], facets: Facet[], state: FilterState) {
  const scope = (key: Key) => items.filter((item) => matches(item, state, key))
  // Вкладки групп видны всегда: переключение группы и так сбрасывает остальные условия.
  const groupCounts = countBy(items, (item) => [item.group])
  const directionCounts = countBy(scope('direction'), (item) => item.directions)
  const typeCounts = countBy(scope('type'), (item) => item.types)
  const vendorCounts = countBy(scope('vendors'), (item) => [item.vendor])
  const taskCounts = countBy(scope('tasks'), (item) => item.tasks)
  const section = state.type ?? state.direction
  const pins = facets.find((facet) => facet.slug === section)?.pins ?? []

  const fromFacets = (list: Facet[], counts: Map<string, number>, selected: string | null) =>
    list
      .map((facet) => ({
        value: facet.slug,
        label: facet.title,
        count: counts.get(facet.slug) ?? 0,
      }))
      .filter((option) => option.count > 0 || option.value === selected)
  const fromCounts = (
    counts: Map<string, number>,
    selected: string[],
    order: (a: Option, b: Option) => number = byLabel,
  ) =>
    [...new Set([...counts.keys(), ...selected])]
      .map((value) => ({ value, label: value, count: counts.get(value) ?? 0 }))
      .sort(order)

  const typeGroup: CatalogGroup = state.group === 'service' ? 'service' : 'hardware'
  // Задачи показываются, только если сужают выдачу: когда каждая задача оставляет то же самое,
  // список галочек ничего не даёт (замечание владельца 12.10.2026 про GEO5).
  const taskList = fromCounts(taskCounts, state.tasks)
  const shown = items.filter((item) => matches(item, state)).length
  const narrows = state.tasks.length > 0 || taskList.some((option) => option.count !== shown)
  return {
    groups: groups.filter((group) => (groupCounts.get(group) ?? 0) > 0),
    directions:
      state.group === null || state.group === 'software'
        ? fromFacets(
            facets.filter((f) => f.isDirection),
            directionCounts,
            state.direction,
          )
        : [],
    typeGroup,
    types:
      state.group === 'software'
        ? []
        : fromFacets(
            facets.filter((f) => !f.isDirection && f.group === typeGroup),
            typeCounts,
            state.type,
          ),
    // У услуг список производителей не нужен: там один CAD.kz (аудит 21.10.2026, К5).
    vendors:
      state.group === 'service'
        ? []
        : fromCounts(vendorCounts, state.vendors, vendorOrder(items, pins)),
    // Задачи раскрываются после выбора направления или типа: так фильтр остаётся коротким.
    tasks: (state.direction || state.type) && narrows ? taskList : [],
  }
}

/** Изменение одного условия. Смена группы или направления сбрасывает то, что стоит ниже по каскаду. */
export function update(state: FilterState, change: Partial<FilterState>): FilterState {
  const next = { ...state, ...change, page: change.page ?? 1 }
  if ('group' in change) {
    next.direction = null
    next.type = null
    next.vendors = []
    next.tasks = []
  }
  if ('direction' in change || 'type' in change) next.tasks = []
  // Линейка принадлежит одному производителю: другой выбор производителя её сбрасывает.
  if (('group' in change || 'vendors' in change) && !('line' in change)) next.line = null
  return next
}

/**
 * Убирает выбранных производителей, которых нет при новых условиях: был SCAD Soft, нажали
 * «Архитектура и BIM» без SCAD — производитель снимается, а не получается пустой экран
 * (аудит 21.10.2026, К3). Линейка снимается вместе со своим производителем.
 */
export function pruneVendors(items: CatalogItem[], state: FilterState): FilterState {
  if (!state.vendors.length) return state
  const open = { ...state, line: null }
  const present = new Set(
    items.filter((item) => matches(item, open, 'vendors')).map((item) => item.vendor ?? ''),
  )
  const vendors = state.vendors.filter((vendor) => present.has(vendor))
  if (vendors.length === state.vendors.length) return state
  return { ...state, vendors, line: null }
}

/**
 * Найденные товары страницы. Список с сервера уже упорядочен по приоритету; если выбран раздел,
 * порядок уточняется под него: производители раздела по порядку, товары с этим основным разделом выше.
 */
export function results(items: CatalogItem[], state: FilterState, facets: Facet[] = []) {
  const list = items.filter((item) => matches(item, state))
  const section = state.type ?? state.direction
  if (section) {
    const pins = facets.find((facet) => facet.slug === section)?.pins ?? []
    list.sort(compareInSection(section, pins))
  }
  // В линейке основа первой, потом пакеты и модули («Порядок в линейке»).
  if (state.line) list.sort(compareInLine)
  const pages = Math.max(1, Math.ceil(list.length / PAGE_SIZE))
  const page = Math.min(state.page, pages)
  return {
    total: list.length,
    pages,
    page,
    items: list.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE),
  }
}

/**
 * Если в разделе остался один производитель, шаг выбора производителя лишний: каталог сразу
 * показывает его товары группами. Возвращает выбор для показа, адрес страницы не меняется.
 */
export function autoVendor(items: CatalogItem[], state: FilterState): FilterState {
  if (!(state.type ?? state.direction) || state.vendors.length) return state
  const vendors = new Set(
    items.filter((item) => matches(item, state)).map((item) => item.vendor ?? ''),
  )
  const [only] = vendors
  return vendors.size === 1 && only ? { ...state, vendors: [only] } : state
}

export type ResultGroup = {
  key: string
  /** Пусто — группа одна, заголовок не нужен. */
  title: string
  /** Страница семейства: там можно отметить несколько программ сразу. */
  href: string | null
  items: CatalogItem[]
}

/**
 * Товары выбранного производителя по линейкам («Программный комплекс», «Программы-сателлиты»):
 * без отдельного шага с карточками линеек. null — производитель не выбран, обычная сетка.
 */
export function groupedResults(
  items: CatalogItem[],
  state: FilterState,
  lines: CatalogLine[],
): ResultGroup[] | null {
  if (!vendorView(state)) return null
  const list = items.filter((item) => matches(item, state))
  const own = lines
    .filter((line) => line.vendor === state.vendors[0])
    .sort((a, b) => a.order - b.order || a.title.localeCompare(b.title, 'ru'))
  const groups: ResultGroup[] = own
    .map((line) => ({
      key: line.id,
      title: line.title,
      href: line.familyHref,
      items: list.filter((item) => item.line === line.id).sort(compareInLine),
    }))
    .filter((group) => group.items.length > 0)
  const known = new Set(groups.map((group) => group.key))
  const rest = list.filter((item) => item.line == null || !known.has(item.line))
  if (rest.length)
    groups.push({
      key: 'other',
      title: groups.length ? 'Другие программы' : '',
      href: null,
      items: rest.sort(compareInLine),
    })
  if (groups.length === 1 && groups[0]) groups[0] = { ...groups[0], title: '' }
  return groups
}

/** Состояние ↔ адрес страницы: ссылку на подборку можно отправить коллеге. */
export function fromParams(params: Record<string, string | string[] | undefined>): FilterState {
  const one = (key: string) => {
    const value = params[key]
    return (Array.isArray(value) ? value[0] : value) || null
  }
  const many = (key: string) => {
    const value = params[key]
    return (Array.isArray(value) ? value : value ? [value] : []).filter(Boolean)
  }
  const group = one('group')
  const page = Number(one('page'))
  return {
    group: groups.includes(group as CatalogGroup) ? (group as CatalogGroup) : null,
    direction: one('direction'),
    type: one('type'),
    vendors: many('vendor'),
    line: one('line'),
    tasks: many('task'),
    page: Number.isInteger(page) && page > 0 ? page : 1,
  }
}

export function toQuery(state: FilterState) {
  const query = new URLSearchParams()
  if (state.group) query.set('group', state.group)
  if (state.direction) query.set('direction', state.direction)
  if (state.type) query.set('type', state.type)
  for (const vendor of state.vendors) query.append('vendor', vendor)
  if (state.line) query.set('line', state.line)
  for (const task of state.tasks) query.append('task', task)
  if (state.page > 1) query.set('page', String(state.page))
  return query.toString()
}
