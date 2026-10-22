/**
 * Каскадный фильтр каталога: чистые функции без React и сервера.
 * Счётчик у значения (на сайте не показывается) — сколько товаров останется, если его выбрать
 * при всех остальных выбранных условиях: по нему скрываются пустые варианты.
 */

import { featureDefinition, featureLabel, featureValue } from '../domain/catalogFeatureValues.mjs'
import { compareInLine } from '../domain/catalogTree.mjs'
import equipmentFacets from '../domain/equipmentFacets.json' with { type: 'json' }
import { compareInSection } from '../domain/priority.mjs'
import type { CatalogGroup, CatalogItem, CatalogLine, Facet } from './catalog'
import type { Picture } from './pictures'

export type FilterState = {
  group: CatalogGroup | null
  direction: string | null
  type: string | null
  vendors: string[]
  /** Линейка производителя (id строкой): шаг после выбора одного производителя. */
  line: string | null
  tasks: string[]
  features: Record<string, string[]>
  page: number
}

type Key = 'group' | 'direction' | 'type' | 'vendors' | 'line' | 'tasks' | `feature:${string}`

export const PAGE_SIZE = 9
export const emptyFilter: FilterState = {
  group: null,
  direction: null,
  type: null,
  vendors: [],
  line: null,
  tasks: [],
  features: {},
  page: 1,
}

const groups: CatalogGroup[] = ['software', 'hardware', 'service']
const catalogFeatures = equipmentFacets.map((category) => ({
  ...category,
  filters: category.filters.map((filter) => featureDefinition(category.category, filter)),
}))

/** Выбран ровно один производитель: его товары показываются группами по линейкам. */
export const vendorView = (state: FilterState) => state.vendors.length === 1

/** Видна ли карточка при этом выборе (поле scope, src/lib/catalog.ts). */
function visible(item: CatalogItem, state: FilterState, ignore?: Key) {
  // Для счётчиков задач считаем, будто задача уже выбрана: иначе задачи, которые есть только
  // у отдельных программ GEO5, не попали бы в список.
  const tasksOn = state.tasks.length > 0 || ignore === 'tasks'
  const featuresOn =
    Object.values(state.features ?? {}).some((values) => values.length) ||
    ignore?.startsWith('feature:')
  switch (item.scope) {
    case 'family':
      return !vendorView(state) && !featuresOn
    case 'detail':
      return vendorView(state) || tasksOn || featuresOn
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
  const category = featureCategory(state)
  for (const filter of category?.filters ?? []) {
    const key = `${category?.category}.${filter.key}`
    const selected = state.features?.[key] ?? []
    if (ignore === `feature:${key}` || !selected.length) continue
    if (
      item.research?.category !== category?.category ||
      !selected.some((value) =>
        item.research?.filters[filter.key]?.some(
          (raw) => featureValue(category?.category, filter.key, raw) === value,
        ),
      )
    )
      return false
  }
  return true
}

/** 3D-сканеры в CMS называются scanners; родительские плитки не получают фильтров детей. */
function featureCategory(state: Pick<FilterState, 'type' | 'group' | 'direction'>) {
  const category =
    state.type === 'scanners'
      ? '3d-scanners'
      : (state.type ??
        (state.group === 'software' || (state.direction && !state.group) ? 'software' : null))
  return catalogFeatures.find((entry) => entry.category === category)
}

/** Внутри группы — ИЛИ, между группами — И; счётчик игнорирует только свою группу. */
export function featureOptions(items: CatalogItem[], state: FilterState) {
  const category = featureCategory(state)
  return (category?.filters ?? [])
    .map((filter) => {
      const key = `${category?.category}.${filter.key}`
      const selected = state.features?.[key] ?? []
      const scope = items.filter(
        (item) =>
          item.research?.category === category?.category && matches(item, state, `feature:${key}`),
      )
      const options = filter.values
        .map((value) => ({
          value,
          label: featureLabel(category?.category, filter.key, value),
          count: scope.filter((item) =>
            item.research?.filters[filter.key]?.some(
              (raw) => featureValue(category?.category, filter.key, raw) === value,
            ),
          ).length,
        }))
        .filter((option) => option.count > 0 || selected.includes(option.value))
      // Единственный общий признак ничего не уточняет, но выбранную галочку всегда можно снять.
      return {
        key,
        label: filter.label,
        options:
          !selected.length && options.length === 1 && options[0]?.count === scope.length
            ? []
            : options,
      }
    })
    .filter((group) => group.options.length)
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
  // Открыт подраздел («Плоттеры») — в списке типов отмечен его родитель.
  const typeSelected = parentType(facets, state.type)
  // Задачи показываются, только если сужают выдачу: когда каждая задача оставляет то же самое,
  // список галочек ничего не даёт (замечание владельца 12.10.2026 про GEO5).
  const taskList = fromCounts(taskCounts, state.tasks)
  const shown = items.filter((item) => matches(item, state)).length
  const narrows = state.tasks.length > 0 || taskList.some((option) => option.count !== shown)
  return {
    features: featureOptions(items, state),
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
            facets.filter((f) => !f.isDirection && !f.parent && f.group === typeGroup),
            typeCounts,
            typeSelected,
          ),
    typeSelected,
    // У услуг список производителей не нужен: там один CAD.kz (аудит 21.10.2026, К5).
    vendors:
      state.group === 'service'
        ? []
        : fromCounts(vendorCounts, state.vendors, vendorOrder(items, pins)),
    // Задачи раскрываются после выбора направления или типа: так фильтр остаётся коротким.
    tasks: (state.direction || state.type) && narrows ? taskList : [],
  }
}

/** Верхний тип для выбранного раздела: у подраздела — его родитель, иначе он сам. */
export function parentType(facets: Facet[], type: string | null) {
  if (!type) return null
  return facets.find((facet) => facet.slug === type)?.parent ?? type
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
  if ('group' in change || 'direction' in change || 'type' in change) next.features = {}
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
  const open = { ...state, line: null, features: {} }
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
    items
      .filter((item) => matches(item, { ...state, features: {} }))
      .map((item) => item.vendor ?? ''),
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

/**
 * Влитые направления: старая ссылка открывает новое («САПР и черчение» влито в «САПР,
 * архитектура и BIM» 22.10.2026).
 */
const DIRECTION_ALIASES: Record<string, string> = { cad: 'arch' }

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
  const features: Record<string, string[]> = {}
  const category = featureCategory({
    group: groups.includes(group as CatalogGroup) ? (group as CatalogGroup) : null,
    type: one('type'),
    direction: one('direction'),
  })
  for (const filter of category?.filters ?? []) {
    const key = `${category?.category}.${filter.key}`
    const selected = [
      ...new Set(
        many(`spec.${key}`).map((value) => featureValue(category?.category, filter.key, value)),
      ),
    ].filter((value) => filter.values.includes(value))
    if (selected.length) features[key] = selected
  }
  return {
    group: groups.includes(group as CatalogGroup) ? (group as CatalogGroup) : null,
    direction: (() => {
      const direction = one('direction')
      return direction ? (DIRECTION_ALIASES[direction] ?? direction) : null
    })(),
    type: one('type'),
    vendors: many('vendor'),
    line: one('line'),
    tasks: many('task'),
    features,
    page: Number.isInteger(page) && page > 0 ? page : 1,
  }
}

/** Выбор из строки адреса в браузере (?direction=…&vendor=…): для «Назад» и «Вперёд». */
export function fromSearch(search: string): FilterState {
  const query = new URLSearchParams(search)
  const params: Record<string, string[]> = {}
  for (const key of new Set(query.keys())) params[key] = query.getAll(key)
  return fromParams(params)
}

export function toQuery(state: FilterState) {
  const query = new URLSearchParams()
  if (state.group) query.set('group', state.group)
  if (state.direction) query.set('direction', state.direction)
  if (state.type) query.set('type', state.type)
  for (const vendor of state.vendors) query.append('vendor', vendor)
  if (state.line) query.set('line', state.line)
  for (const task of state.tasks) query.append('task', task)
  for (const [key, values] of Object.entries(state.features ?? {}))
    for (const value of values) query.append(`spec.${key}`, value)
  if (state.page > 1) query.set('page', String(state.page))
  return query.toString()
}

/** Плитка типа оборудования или подраздела. Подпись собирает компонент (SectionTiles). */
export type SectionTile = {
  slug: string
  title: string
  /** Описание раздела из админки, если есть. */
  summary: string | null
  /** Иконка раздела — вместо фото, если у товаров раздела картинок нет. */
  icon: string | null
  /** Названия подразделов («Плоттеры», «Комплектующие») — у типа с подразделами. */
  children: string[]
  /** Производители раздела по порядку каталога. */
  vendors: string[]
  count: number
  /** Фото первого по порядку раздела товара. */
  picture: Picture | null
}

/** Какой шаг «плитками разделов» сейчас: типы оборудования или подразделы типа. */
export type SectionStep = { kind: 'type' | 'sub'; tiles: SectionTile[] }

function sectionTile(items: CatalogItem[], facets: Facet[], facet: Facet, base: FilterState) {
  const list = items
    .filter((item) => matches(item, { ...base, type: facet.slug }))
    .sort(compareInSection(facet.slug, facet.pins ?? []))
  // Родитель широкоформата иллюстрируется устройством, никогда расходником из дочернего раздела.
  const illustrated =
    facet.slug === 'wide-format' ? list.filter((item) => item.types.includes('plotters')) : list
  const photo = illustrated.find((item) => item.picture && item.picture.fit !== 'logo')
  return {
    slug: facet.slug,
    title: facet.title,
    summary: facet.summary ?? null,
    icon: facet.icon ?? null,
    children: facets.filter((child) => child.parent === facet.slug).map((child) => child.title),
    vendors: [...new Set(list.flatMap((item) => (item.vendor ? [item.vendor] : [])))],
    count: list.length,
    picture: (photo ?? illustrated.find((item) => item.picture))?.picture ?? null,
  }
}

/**
 * Оборудование как папки в Битриксе (замечание владельца 22.10.2026): во вкладке «Оборудование»
 * сначала плитки типов (3D-сканеры, плоттеры, широкоформатные сканеры, рабочие станции), в типе
 * с подразделами — плитки подразделов («Плоттеры», «Комплектующие»). Не нужен, когда выбран
 * производитель или задачи, и когда плитка вышла бы одна.
 */
export function sectionStep(
  items: CatalogItem[],
  facets: Facet[],
  state: FilterState,
): SectionStep | null {
  if (state.vendors.length || state.tasks.length || state.line) return null
  const base: FilterState = { ...state, type: null, page: 1 }
  const make = (kind: SectionStep['kind'], list: Facet[]) => {
    const tiles = list
      .map((facet) => sectionTile(items, facets, facet, base))
      .filter((tile) => tile.count > 0)
    return tiles.length > 1 ? { kind, tiles } : null
  }
  if (state.type)
    return make(
      'sub',
      facets.filter((facet) => facet.parent === state.type),
    )
  if (state.group !== 'hardware' || state.direction) return null
  return make(
    'type',
    facets.filter((f) => f.group === 'hardware' && !f.isDirection && !f.parent),
  )
}
