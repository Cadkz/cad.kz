// @ts-check
/**
 * Подсказки поиска в шапке: что показать под полем по ходу набора.
 * Чистая логика без базы и сети — её же позже вызовет ИИ-помощник (общий поисковый слой).
 *
 * Источник — индекс сайта (src/lib/searchIndex.ts): товары и семейства, производители, разделы
 * каталога, страницы сайта. Совпадения ищет src/domain/search.mjs (регистр, кириллица, опечатки).
 * Это поиск по словам: «программа для вентиляции» он находит по слову «вентиляции» (служебные
 * слова не мешают), но задачу своими словами не понимает — такое будет делать ИИ-помощник.
 */
import { normalize, searchDetailed, searchItems } from './search.mjs'

/**
 * @typedef {'product' | 'family' | 'vendor' | 'section' | 'page'} SuggestType
 * @typedef {{ type: SuggestType, title: string, href: string, label: string,
 *   note?: string | null, vendor?: string | null, aliases?: string | null, summary?: string | null,
 *   tasks?: string[], sections?: string[], parts?: string, keywords?: string }} SuggestEntry
 * @typedef {{ products: SuggestEntry[], vendors: SuggestEntry[], sections: SuggestEntry[],
 *   pages: SuggestEntry[] }} SuggestIndex
 * @typedef {{ type: SuggestType, title: string, href: string, label: string, note: string | null,
 *   group?: string }} Suggestion
 * @typedef {{ query: string, items: Suggestion[], more: boolean }} SuggestResult
 */

/**
 * Сколько строк в каждой группе панели (замечание владельца 03.11.2026: «длинный тупой список» —
 * лучше как в мегаменю: сами программы, отдельно дополнения к ним, отдельно курсы). Остальное —
 * по ссылке «Все результаты».
 */
const GROUP_LIMIT = /** @type {const} */ ({ products: 4, addons: 3, courses: 2, others: 2 })
/** Всего строк не больше (сумма групп). */
export const SUGGEST_LIMIT =
  GROUP_LIMIT.products + GROUP_LIMIT.addons + GROUP_LIMIT.courses + GROUP_LIMIT.others
/** Короче — не ищем: по одной букве подходит половина каталога. */
export const MIN_QUERY = 2

/**
 * @typedef {'products' | 'addons' | 'courses' | 'vendors' | 'sections' | 'pages'} SuggestGroup
 */

/**
 * @param {SuggestEntry} entry
 * @param {SuggestGroup} group
 * @returns {Suggestion}
 */
const toSuggestion = ({ type, title, href, label, note }, group) => ({
  type,
  title,
  href,
  label,
  note: note ?? null,
  group,
})

/** «MagiCAD Вентиляция для AutoCAD», «… for Revit» — дополнение к названной программе. */
const FOR_PROGRAM = /\s(?:для|for)\s+(.+)$/i

/**
 * Дополнение к тому, что ищут: «для <программа из запроса>» в названии («автокад» → MagiCAD для
 * AutoCAD) или «Требуется базовое ПО» (addons из searchDetailed).
 * @param {SuggestEntry} entry
 * @param {string} query
 */
function addonByTitle(entry, query) {
  const tail = FOR_PROGRAM.exec(entry.title)?.[1]
  if (!tail) return false
  // Сама программа в начале названия совпала с запросом — это она, а не дополнение.
  const head = entry.title.slice(0, entry.title.length - tail.length)
  if (searchItems([{ title: head }], query, 1, true).length) return false
  return searchItems([{ title: tail }], query, 1, true).length > 0
}

/**
 * Подсказки по запросу группами: товары, дополнения к найденным программам, курсы, затем
 * производитель, раздел, страница. В каждой группе — не больше своего лимита.
 * more — что-то не поместилось.
 * @param {SuggestIndex} index
 * @param {string} rawQuery
 * @returns {SuggestResult}
 */
export function suggest(index, rawQuery) {
  const query = rawQuery.trim().slice(0, 100)
  if (normalize(query).length < MIN_QUERY) return { query, items: [], more: false }
  const found = searchDetailed(index.products, query, 60)
  const addonSet = new Set(found.addons)
  const all = onePerPlace([...found.items, ...found.addons])
  /** @type {Record<'products' | 'addons' | 'courses', SuggestEntry[]>} */
  const parts = { products: [], addons: [], courses: [] }
  for (const entry of all) {
    if (entry.label === 'Курс') parts.courses.push(entry)
    else if (addonSet.has(entry) || addonByTitle(entry, query)) parts.addons.push(entry)
    else parts.products.push(entry)
  }
  /** @type {{ entry: SuggestEntry, group: SuggestGroup }[]} */
  const others = [
    ...searchItems(index.vendors, query, 1, true).map((entry) => ({
      entry,
      group: /** @type {SuggestGroup} */ ('vendors'),
    })),
    ...searchItems(index.sections, query, 2, true).map((entry) => ({
      entry,
      group: /** @type {SuggestGroup} */ ('sections'),
    })),
    ...searchItems(index.pages, query, 1, true).map((entry) => ({
      entry,
      group: /** @type {SuggestGroup} */ ('pages'),
    })),
  ]
  const items = [
    ...parts.products.slice(0, GROUP_LIMIT.products).map((e) => toSuggestion(e, 'products')),
    ...parts.addons.slice(0, GROUP_LIMIT.addons).map((e) => toSuggestion(e, 'addons')),
    ...parts.courses.slice(0, GROUP_LIMIT.courses).map((e) => toSuggestion(e, 'courses')),
    ...others.slice(0, GROUP_LIMIT.others).map(({ entry, group }) => toSuggestion(entry, group)),
  ]
  const more =
    parts.products.length > GROUP_LIMIT.products ||
    parts.addons.length > GROUP_LIMIT.addons ||
    parts.courses.length > GROUP_LIMIT.courses
  return { query, items, more }
}

/**
 * Одна строка на место, куда ведёт подсказка: 15 продлений «Изоляции» ведут в одно семейство —
 * показываем первое (самое подходящее), а не 15 одинаковых строк.
 * @param {SuggestEntry[]} entries
 */
function onePerPlace(entries) {
  const seen = new Set()
  return entries.filter((entry) => {
    const place = entry.href.split('#')[0]
    if (seen.has(place)) return false
    seen.add(place)
    return true
  })
}

/** Группы панели подсказок в порядке показа. Пустые группы не показываются. */
const GROUPS = /** @type {const} */ ([
  { key: 'products', title: 'Товары', types: ['product', 'family'] },
  { key: 'addons', title: 'Дополнения и плагины', types: [] },
  { key: 'courses', title: 'Обучение', types: [] },
  { key: 'vendors', title: 'Производители', types: ['vendor'] },
  { key: 'sections', title: 'Разделы каталога', types: ['section'] },
  { key: 'pages', title: 'Страницы сайта', types: ['page'] },
])

/**
 * Подсказки по группам: товары, дополнения, курсы, производители, разделы, страницы. Группа —
 * из ответа (group), без неё — по типу. Внутри группы — порядок ответа.
 * @template {{ type: SuggestType, group?: string }} T
 * @param {T[]} items
 * @returns {{ key: string, title: string, items: T[] }[]}
 */
export function groupSuggestions(items) {
  /** @param {T} item */
  const groupOf = (item) =>
    item.group ??
    GROUPS.find((g) => /** @type {readonly string[]} */ (g.types).includes(item.type))?.key
  return GROUPS.map(({ key, title }) => ({
    key,
    title,
    items: items.filter((item) => groupOf(item) === key),
  })).filter((group) => group.items.length > 0)
}

/**
 * Куски названия с отметкой, совпал ли кусок с началом слова запроса: «SCAD Office» по «скад» —
 * не выделяется (совпало по звучанию), по «off» — выделено «Off». Регистр и «ё» не важны.
 * @param {string} title
 * @param {string} query
 * @returns {{ text: string, match: boolean }[]}
 */
export function markMatches(title, query) {
  // Те же длины строк: toLowerCase и ё→е не меняют число символов, позиции совпадают.
  const fold = (/** @type {string} */ text) => text.toLowerCase().replace(/ё/g, 'е')
  const haystack = fold(title)
  const words = [...new Set(fold(query).split(/[^\p{L}\p{N}]+/u))].filter((w) => w.length >= 2)
  /** @type {boolean[]} */
  const marked = Array.from({ length: title.length }, () => false)
  for (const word of words)
    for (const at of wordStarts(haystack, word))
      for (let i = at; i < at + word.length; i += 1) marked[i] = true
  /** @type {{ text: string, match: boolean }[]} */
  const parts = []
  for (let i = 0; i < title.length; i += 1) {
    const last = parts[parts.length - 1]
    if (last && last.match === marked[i]) last.text += title[i]
    else parts.push({ text: title[i] ?? '', match: Boolean(marked[i]) })
  }
  return parts
}

/**
 * Где слово запроса стоит в начале слова названия: «scad» в «SCAD++» — да, «ad» в «SCAD» — нет.
 * @param {string} haystack
 * @param {string} word
 * @returns {number[]}
 */
function wordStarts(haystack, word) {
  /** @type {number[]} */
  const found = []
  for (let at = haystack.indexOf(word); at >= 0; at = haystack.indexOf(word, at + 1)) {
    const prev = haystack[at - 1]
    if (prev === undefined || !/[\p{L}\p{N}]/u.test(prev)) found.push(at)
  }
  return found
}
