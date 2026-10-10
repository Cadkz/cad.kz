// @ts-check
/**
 * Подсказки поиска в шапке: что показать под полем по ходу набора.
 * Чистая логика без базы и сети — её же позже вызовет ИИ-помощник (общий поисковый слой).
 *
 * Источник — индекс сайта (src/lib/searchIndex.ts): товары и семейства, производители, разделы
 * каталога, страницы сайта. Совпадения ищет src/domain/search.mjs (регистр, кириллица, опечатки).
 * Это обычный поиск по словам: задачу вида «программа для подпорной стены» он не понимает —
 * такое будет делать ИИ-помощник.
 */
import { normalize, searchItems } from './search.mjs'

/**
 * @typedef {'product' | 'family' | 'vendor' | 'section' | 'page'} SuggestType
 * @typedef {{ type: SuggestType, title: string, href: string, label: string,
 *   note?: string | null, vendor?: string | null, aliases?: string | null, summary?: string | null,
 *   tasks?: string[] }} SuggestEntry
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
  const products = searchItems(index.products, query, 60)
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
