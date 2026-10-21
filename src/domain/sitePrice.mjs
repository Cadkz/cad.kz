// @ts-check
// Цена на сайте и цена у Кадди — одна правда (аудит 21.10.2026, К7 и Ка2). Кадди берёт цену из
// внутреннего прайса компании, а каталог показывает цены предложений из админки. Если у товара или
// варианта на сайте «Цена по запросу» (например, полный AutoCAD — решение владельца 12.10.2026),
// Кадди тоже не называет число: иначе клиент видит две разные цены и не верит ни одной.
// Чистые функции без базы: строка прайса → товар или вариант каталога по названию.

/**
 * @typedef {object} SiteEntry  Товар или вариант каталога, как его видит клиент.
 * @property {string} title  «AutoCAD», «AutoCAD LT», «GEO5 Устойчивость откоса».
 * @property {string | null} priceFrom  Цена «от» на сайте или null — «Цена по запросу».
 * @property {boolean} variant  Вариант внутри карточки (точнее товара: у карточки AutoCAD цена «от»
 *   может быть ценой LT, а у варианта «AutoCAD» — по запросу).
 *
 * @typedef {{ family: string, name: string, edition: string }} PriceRowNames
 */

/** Слово производителя в начале названия ничего не различает: «Autodesk AutoCAD» = «AutoCAD». */
const VENDOR_WORDS = new Set(['autodesk'])

/** Слова названия: нижний регистр, ё → е, без знаков; производитель в начале убран. */
export function nameWords(/** @type {string} */ value) {
  const words = value
    .toLowerCase()
    .replaceAll('ё', 'е')
    .split(/[^a-zа-я0-9]+/)
    .filter(Boolean)
  return VENDOR_WORDS.has(words[0] ?? '') ? words.slice(1) : words
}

/** Слова head идут в начале words целиком: «autocad» — начало «autocad lt 2027», но не «autocadlt». */
function startsWith(/** @type {string[]} */ words, /** @type {string[]} */ head) {
  return head.length > 0 && head.length <= words.length && head.every((w, i) => words[i] === w)
}

/**
 * Товар или вариант сайта, к которому относится строка прайса: его название — начало названия
 * строки, семейства или «название + редакция». Из подходящих — самое длинное название («AutoCAD LT»
 * точнее «AutoCAD»), при равных — вариант (он точнее карточки). Названия короче четырёх букв не
 * сравниваются: слишком легко совпасть случайно. Ничего не подошло — null, тогда сайт не мешает.
 * @param {PriceRowNames} row
 * @param {SiteEntry[]} entries
 * @returns {SiteEntry | null}
 */
export function siteEntryFor(row, entries) {
  const sources = [
    nameWords(row.name),
    nameWords(`${row.name} ${row.edition}`),
    nameWords(row.family),
    nameWords(`${row.family} ${row.edition}`),
  ]
  /** @type {{ entry: SiteEntry, length: number } | null} */
  let best = null
  for (const entry of entries) {
    const head = nameWords(entry.title)
    if (head.join('').length < 4) continue
    if (!sources.some((words) => startsWith(words, head))) continue
    const better =
      !best ||
      head.length > best.length ||
      (head.length === best.length && entry.variant && !best.entry.variant)
    if (better) best = { entry, length: head.length }
  }
  return best?.entry ?? null
}

/** Причина для модели, если на сайте у этой позиции «Цена по запросу». */
export const SITE_REQUEST_NOTE =
  'На сайте у этого товара «Цена по запросу» — число не называй: скажи, что стоимость предоставляется по запросу и её уточнит менеджер'

/**
 * Можно ли называть цену строки с учётом сайта: null — сайт не против (цена на сайте есть или
 * товар не найден), иначе — причина словами для модели.
 * @param {PriceRowNames} row
 * @param {SiteEntry[]} entries
 */
export function siteBlocksPrice(row, entries) {
  const entry = siteEntryFor(row, entries)
  return entry && entry.priceFrom === null ? SITE_REQUEST_NOTE : null
}
