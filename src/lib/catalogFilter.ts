/**
 * Каскадный фильтр каталога: чистые функции без React и сервера.
 * Счётчик у значения показывает, сколько товаров останется, если его выбрать
 * при всех остальных выбранных условиях (как в фасетном фильтре shop.kz).
 */
import type { CatalogGroup, CatalogItem, Facet } from './catalog'

export type FilterState = {
  group: CatalogGroup | null
  direction: string | null
  type: string | null
  vendors: string[]
  tasks: string[]
  page: number
}

type Key = 'group' | 'direction' | 'type' | 'vendors' | 'tasks'

export const PAGE_SIZE = 9
export const emptyFilter: FilterState = {
  group: null,
  direction: null,
  type: null,
  vendors: [],
  tasks: [],
  page: 1,
}

const groups: CatalogGroup[] = ['software', 'hardware', 'service']

export function matches(item: CatalogItem, state: FilterState, ignore?: Key) {
  if (ignore !== 'group' && state.group && item.group !== state.group) return false
  if (ignore !== 'direction' && state.direction && !item.directions.includes(state.direction))
    return false
  if (ignore !== 'type' && state.type && !item.types.includes(state.type)) return false
  if (ignore !== 'vendors' && state.vendors.length && !state.vendors.includes(item.vendor ?? ''))
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

/** Варианты всех групп фильтра для текущего выбора. Пустые варианты скрыты, выбранные — нет. */
export function facetOptions(items: CatalogItem[], facets: Facet[], state: FilterState) {
  const scope = (key: Key) => items.filter((item) => matches(item, state, key))
  // Вкладки групп видны всегда: переключение группы и так сбрасывает остальные условия.
  const groupCounts = countBy(items, (item) => [item.group])
  const directionCounts = countBy(scope('direction'), (item) => item.directions)
  const typeCounts = countBy(scope('type'), (item) => item.types)
  const vendorCounts = countBy(scope('vendors'), (item) => [item.vendor])
  const taskCounts = countBy(scope('tasks'), (item) => item.tasks)

  const fromFacets = (list: Facet[], counts: Map<string, number>, selected: string | null) =>
    list
      .map((facet) => ({
        value: facet.slug,
        label: facet.title,
        count: counts.get(facet.slug) ?? 0,
      }))
      .filter((option) => option.count > 0 || option.value === selected)
  const fromCounts = (counts: Map<string, number>, selected: string[]) =>
    [...new Set([...counts.keys(), ...selected])]
      .map((value) => ({ value, label: value, count: counts.get(value) ?? 0 }))
      .sort(byLabel)

  const typeGroup: CatalogGroup = state.group === 'service' ? 'service' : 'hardware'
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
    vendors: fromCounts(vendorCounts, state.vendors),
    // Задачи раскрываются после выбора направления или типа: так фильтр остаётся коротким.
    tasks: state.direction || state.type ? fromCounts(taskCounts, state.tasks) : [],
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
  return next
}

export function results(items: CatalogItem[], state: FilterState) {
  const list = items.filter((item) => matches(item, state))
  const pages = Math.max(1, Math.ceil(list.length / PAGE_SIZE))
  const page = Math.min(state.page, pages)
  return {
    total: list.length,
    pages,
    page,
    items: list.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE),
  }
}

export function activeCount(state: FilterState) {
  return (
    Number(Boolean(state.group)) +
    Number(Boolean(state.direction)) +
    Number(Boolean(state.type)) +
    state.vendors.length +
    state.tasks.length
  )
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
  for (const task of state.tasks) query.append('task', task)
  if (state.page > 1) query.set('page', String(state.page))
  return query.toString()
}
