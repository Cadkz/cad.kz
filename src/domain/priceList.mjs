/**
 * Прайс производителя → предложения каталога. Чистые функции без базы и сети.
 *
 * 1. guessColumns: где в таблице заголовок, название, цена и (если есть) ID предложения.
 * 2. parsePrice: цена из ячейки в десятичную строку для src/domain/pricing.mjs.
 * 3. matchRows: строка прайса → предложение. Сначала ID (файл, скачанный с нашей же страницы),
 *    потом запомненное название из прошлых загрузок, потом похожесть названий.
 */

/** @typedef {{ headerRow: number, nameCol: number, priceCol: number, idCol: number }} Columns */
/** @typedef {{ index: number, name: string, id: string, price: string | null }} PriceRow */
/** @typedef {{ id: number, label: string, names: string[] }} OfferCandidate */
/**
 * @typedef {'id' | 'saved' | 'auto' | 'check' | 'none' | 'noPrice'} MatchStatus
 * @typedef {{ index: number, offerId: number | null, status: MatchStatus, score: number }} MatchResult
 */

const NAME_HEAD = /наимен|назван|продукт|товар|программ|модул|позици|описани|name|product|item/i
const PRICE_HEAD = /цен|стоим|price|сумм|руб|тенге|тг|₸|eur|usd|€|\$/i
const ID_HEAD = /^\s*(id|ид|id предложения)\s*$/i

/** Не больше этого — за ID не принимаем: это может быть номер строки или артикул. */
const MAX_ID = 10_000_000

/**
 * Где заголовок и нужные колонки. Ищем в первых 30 строках строку, где есть и название, и цена.
 * Без заголовка: название — колонка с самым длинным текстом, цена — колонка, где больше всего чисел.
 * @param {string[][]} rows
 * @returns {Columns}
 */
export function guessColumns(rows) {
  for (let r = 0; r < Math.min(rows.length, 30); r++) {
    const cells = rows[r] ?? []
    const nameCol = cells.findIndex((cell) => NAME_HEAD.test(cell) && !PRICE_HEAD.test(cell))
    const priceCols = cells
      .map((cell, index) => (PRICE_HEAD.test(cell) && index !== nameCol ? index : -1))
      .filter((index) => index >= 0)
    if (nameCol >= 0 && priceCols.length) {
      // Из нескольких колонок цены — та, где под заголовком больше всего чисел.
      const body = rows.slice(r + 1)
      const priceCol = priceCols.reduce((best, col) =>
        countPrices(body, col) > countPrices(body, best) ? col : best,
      )
      return { headerRow: r, nameCol, priceCol, idCol: cells.findIndex((c) => ID_HEAD.test(c)) }
    }
  }
  const width = Math.max(0, ...rows.slice(0, 200).map((row) => row.length))
  let nameCol = 0
  let priceCol = width > 1 ? 1 : 0
  let bestText = -1
  let bestPrices = -1
  for (let col = 0; col < width; col++) {
    const text = rows.slice(0, 200).reduce((sum, row) => sum + textScore(row[col]), 0)
    const prices = countPrices(rows.slice(0, 200), col)
    if (text > bestText) [bestText, nameCol] = [text, col]
    if (prices > bestPrices) [bestPrices, priceCol] = [prices, col]
  }
  return { headerRow: -1, nameCol, priceCol, idCol: -1 }
}

const textScore = (/** @type {string | undefined} */ cell) =>
  cell && parsePrice(cell) == null ? Math.min(cell.length, 80) : 0

const countPrices = (/** @type {string[][]} */ rows, /** @type {number} */ col) =>
  rows.filter((row) => parsePrice(row[col] ?? '') != null).length

/**
 * Цена из ячейки: «1 234 567,89 ₸», «12 500», «1,234.50», «€ 600» → «1234567.89», «12500»…
 * Ноль, текст и «по запросу» — null.
 * @param {string} raw
 * @returns {string | null}
 */
export function parsePrice(raw) {
  let text = String(raw ?? '')
    .replace(/[\s  ']/g, '')
    .replace(/(тенге|тг|руб\.?|₸|€|\$|eur|usd|rub|kzt)/gi, '')
  if (!/^\d[\d.,]*$/.test(text)) return null
  const lastDot = text.lastIndexOf('.')
  const lastComma = text.lastIndexOf(',')
  if (lastDot >= 0 && lastComma >= 0) {
    const decimalMark = lastDot > lastComma ? '.' : ','
    const thousands = decimalMark === '.' ? ',' : '.'
    text = text.split(thousands).join('').replace(decimalMark, '.')
  } else if (lastComma >= 0) {
    // «1,234» и «12,500,000» — разряды, «1,5» и «12,50» — копейки.
    text = /^\d{1,3}(,\d{3})+$/.test(text) ? text.replace(/,/g, '') : text.replace(',', '.')
  } else if (/^\d{1,3}(\.\d{3}){2,}$/.test(text) || /^\d{1,3}\.\d{3}$/.test(text)) {
    // «12.500» в русском прайсе — двенадцать с половиной тысяч, а не 12,5.
    text = text.replace(/\./g, '')
  }
  if (!/^\d{1,12}(\.\d{1,6})?$/.test(text)) return null
  const clean = text.includes('.') ? text.replace(/\.?0+$/, '') : text
  return /^0*(\.0*)?$/.test(clean) ? null : clean.replace(/^0+(?=\d)/, '')
}

const STOP = new Set(
  'на для и с в по от до из к или шт ед лицензия лицензии лицензию программа программное обеспечение право использование использования базовая версия'.split(
    ' ',
  ),
)

/** Кириллица, похожая на латиницу: «SSВ» с русской В в одном прайсе и с латинской B в другом. */
const LOOKALIKE = {
  а: 'a',
  в: 'b',
  е: 'e',
  к: 'k',
  м: 'm',
  н: 'h',
  о: 'o',
  р: 'p',
  с: 'c',
  т: 't',
  у: 'y',
  х: 'x',
}

/**
 * Слова названия для сравнения: нижний регистр, ё → е, без знаков, без служебных слов.
 * @param {string} text
 * @returns {string[]}
 */
export function nameTokens(text) {
  const words = String(text ?? '')
    .toLowerCase()
    .replace(/ё/g, 'е')
    .replace(/[^a-zа-я0-9+]+/g, ' ')
    .split(' ')
    .filter((word) => word && !STOP.has(word))
    .map((word) =>
      /[a-z]/.test(word)
        ? word.replace(/[авекмнорстух]/g, (ch) => LOOKALIKE[/** @type {keyof LOOKALIKE} */ (ch)])
        : word,
    )
  return [...new Set(words)]
}

/** Коды и латинские обозначения (RC, S392, SPRO) различают позиции сильнее обычных слов и чисел. */
const weight = (/** @type {string} */ word) =>
  /^\d+$/.test(word) ? 1 : /[0-9a-z]/.test(word) ? 2 : 1

const weigh = (/** @type {string[]} */ words) => words.reduce((sum, word) => sum + weight(word), 0)

/**
 * Похожесть строки прайса на предложение от 0 до 1: коэффициент Дайса по словам с весами, или,
 * если короткое название прайса целиком входит в длинное название на сайте («Кристалл» →
 * «КРИСТАЛЛ — экспертиза и расчёт…»), доля его слов, чуть ниже полной уверенности.
 * @param {string[]} row слова строки прайса
 * @param {string[]} offer слова предложения
 */
export function similarity(row, offer) {
  const total = weigh(row) + weigh(offer)
  if (!total || !row.length) return 0
  const common = weigh(row.filter((word) => offer.includes(word)))
  return Math.max((2 * common) / total, (0.9 * common) / weigh(row))
}

/** Нормализованное название для запоминания и точного сравнения. */
export const nameKey = (/** @type {string} */ text) => nameTokens(text).join(' ')

export const AUTO_SCORE = 0.75
export const CHECK_SCORE = 0.4

/**
 * Строки прайса → предложения. Одно предложение получает не больше одной строки: при споре
 * остаётся строка с лучшим совпадением, другая уходит на проверку.
 * @param {PriceRow[]} rows
 * @param {OfferCandidate[]} offers
 * @returns {MatchResult[]}
 */
export function matchRows(rows, offers) {
  const byId = new Map(offers.map((offer) => [offer.id, offer]))
  const saved = new Map()
  for (const offer of offers) for (const name of offer.names) saved.set(nameKey(name), offer.id)
  const tokens = offers.map((offer) => ({ id: offer.id, words: nameTokens(offer.label) }))

  /** @type {(MatchResult & { second: number | null })[]} */
  const results = rows.map((row) => {
    const base = { index: row.index, second: null }
    if (row.price == null) return { ...base, offerId: null, status: 'noPrice', score: 0 }
    const id = Number(row.id)
    if (row.id && Number.isSafeInteger(id) && id > 0 && id < MAX_ID && byId.has(id))
      return { ...base, offerId: id, status: 'id', score: 1 }
    const remembered = saved.get(nameKey(row.name))
    if (remembered != null) return { ...base, offerId: remembered, status: 'saved', score: 1 }
    const words = nameTokens(row.name)
    const ranked = tokens
      .map((offer) => ({ id: offer.id, score: similarity(words, offer.words) }))
      .sort((a, b) => b.score - a.score)
    const [best, next] = ranked
    if (!best || best.score < CHECK_SCORE)
      return { ...base, offerId: null, status: 'none', score: round(best?.score ?? 0) }
    const clear = best.score >= AUTO_SCORE && best.score - (next?.score ?? 0) >= 0.08
    return {
      ...base,
      offerId: best.id,
      status: clear ? 'auto' : 'check',
      score: round(best.score),
      second: next && next.score >= CHECK_SCORE ? next.id : null,
    }
  })

  // Спор за одно предложение: выигрывает точное (ID, запомненное), потом лучшее совпадение.
  const strength = (/** @type {MatchResult} */ r) =>
    r.status === 'id' ? 3 : r.status === 'saved' ? 2 : r.score
  const owner = new Map()
  for (const result of [...results].sort((a, b) => strength(b) - strength(a))) {
    if (result.offerId == null) continue
    if (!owner.has(result.offerId)) {
      owner.set(result.offerId, result.index)
      continue
    }
    const alternative = result.second != null && !owner.has(result.second) ? result.second : null
    result.offerId = alternative
    result.status = alternative == null ? 'none' : 'check'
    if (alternative != null) owner.set(alternative, result.index)
  }
  return results.map(({ second: _second, ...result }) => result)
}

const round = (/** @type {number} */ value) => Math.round(value * 100) / 100

/**
 * Строки прайса по выбранным колонкам. Пустые строки и строки без названия пропускаются,
 * строка заголовка — тоже.
 * @param {string[][]} rows
 * @param {Columns} columns
 * @returns {PriceRow[]}
 */
export function priceRows(rows, columns) {
  /** @type {PriceRow[]} */
  const result = []
  rows.forEach((cells, index) => {
    if (index <= columns.headerRow) return
    const name = (cells[columns.nameCol] ?? '').trim()
    if (!name || parsePrice(name) != null) return
    result.push({
      index,
      name,
      id: columns.idCol >= 0 ? (cells[columns.idCol] ?? '').trim() : '',
      price: parsePrice(cells[columns.priceCol] ?? ''),
    })
  })
  return result
}
