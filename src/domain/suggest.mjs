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
import { normalize, searchItems } from './search.mjs'

/**
 * @typedef {'product' | 'family' | 'vendor' | 'section' | 'page'} SuggestType
 * @typedef {{ type: SuggestType, title: string, href: string, label: string,
 *   note?: string | null, vendor?: string | null, aliases?: string | null, summary?: string | null,
 *   tasks?: string[], sections?: string[], parts?: string, keywords?: string }} SuggestEntry
 * @typedef {{ products: SuggestEntry[], vendors: SuggestEntry[], sections: SuggestEntry[],
 *   pages: SuggestEntry[] }} SuggestIndex
 * @typedef {{ type: SuggestType, title: string, href: string, label: string, note: string | null }} Suggestion
 * @typedef {{ query: string, items: Suggestion[], more: boolean }} SuggestResult
 */

/** Сколько строк видно под полем. Остальное — по ссылке «Все результаты». */
export const SUGGEST_LIMIT = 7
/** Сколько первых товаров идёт до производителя и разделов. */
const LEAD_PRODUCTS = 2
/** Сколько строк «не товар» (производитель, раздел, страница) не больше. */
const MAX_OTHER = 3
/** Короче — не ищем: по одной букве подходит половина каталога. */
export const MIN_QUERY = 2

/** @param {SuggestEntry} entry @returns {Suggestion} */
const toSuggestion = ({ type, title, href, label, note }) => ({
  type,
  title,
  href,
  label,
  note: note ?? null,
})

/**
 * Подсказки по запросу. Порядок: два самых подходящих товара, затем производитель, раздел,
 * страница (не больше трёх), затем остальные товары — всего не больше limit.
 * more — есть ещё товары, которые не поместились.
 * @param {SuggestIndex} index
 * @param {string} rawQuery
 * @param {number} [limit]
 * @returns {SuggestResult}
 */
export function suggest(index, rawQuery, limit = SUGGEST_LIMIT) {
  const query = rawQuery.trim().slice(0, 100)
  if (normalize(query).length < MIN_QUERY) return { query, items: [], more: false }
  const products = onePerPlace(searchItems(index.products, query, 60))
  const others = [
    ...searchItems(index.vendors, query, 1, true),
    ...searchItems(index.sections, query, 2, true),
    ...searchItems(index.pages, query, 1, true),
  ].slice(0, MAX_OTHER)
  const shown = products.slice(0, Math.max(0, limit - others.length))
  const items = [...shown.slice(0, LEAD_PRODUCTS), ...others, ...shown.slice(LEAD_PRODUCTS)]
    .slice(0, limit)
    .map(toSuggestion)
  return { query, items, more: products.length > shown.length }
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
  { key: 'vendors', title: 'Производители', types: ['vendor'] },
  { key: 'sections', title: 'Разделы каталога', types: ['section'] },
  { key: 'pages', title: 'Страницы сайта', types: ['page'] },
])

/**
 * Подсказки по группам: товары и семейства, производители, разделы, страницы.
 * Внутри группы — порядок ответа (самое подходящее выше).
 * @template {{ type: SuggestType }} T
 * @param {T[]} items
 * @returns {{ key: string, title: string, items: T[] }[]}
 */
export function groupSuggestions(items) {
  return GROUPS.map(({ key, title, types }) => ({
    key,
    title,
    items: items.filter((item) => /** @type {readonly string[]} */ (types).includes(item.type)),
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
