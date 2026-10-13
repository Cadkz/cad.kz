// @ts-check
// Прайс и база знаний для ИИ-консультанта Кадди: чистые функции без базы и сети.
// Файл компании «Прайс CAD.kz» (.xlsx) — лист product_price_list (код, артикул, семейство,
// названия, тип покупки, срок, редакция, тип лицензии, места, цена, статус цены, срок поставки,
// дата) и лист FAQ (факт | продукт). Файлы внутренние: в репозиторий не кладутся, загружаются
// в админке «Прайс и база Кадди» и хранятся в базе сайта.
// Правила, когда цену можно назвать клиенту и какой срок поставки, — правила владельца
// (разделы 5 и 7 в systemPrompt, src/domain/assistant.mjs); здесь они же в коде, чтобы модель
// физически не получала цену продления или оборудования.

/**
 * @typedef {object} PriceRow
 * @property {string} code  Код — основной идентификатор позиции.
 * @property {string} article
 * @property {string} family  Семейство продукта.
 * @property {string} name  Короткое название.
 * @property {string} fullName  Полное наименование для печати.
 * @property {string} purchase  Тип покупки: «Новая лицензия», «Продление», «Обновление / переход»…
 * @property {number | 'perpetual' | null} term  Срок в месяцах, бессрочно или не указан.
 * @property {string} edition  Редакция / комплектация («» — не указано).
 * @property {string} license  Тип лицензии («» — не указано).
 * @property {number | null} seats  Количество мест (null — не указано).
 * @property {string | null} tiyn  Цена в тиынах (целое число строкой) или null.
 * @property {'price' | 'request' | 'invalid'} status  Цена указана / по запросу / в ячейке ошибка.
 * @property {string} delivery  Срок поставки из прайса.
 * @property {string} updated  Дата обновления строки, ГГГГ-ММ-ДД (или «»).
 *
 * @typedef {{ product: string, text: string }} KnowledgeEntry
 * @typedef {'included' | 'excluded' | 'unknown'} VatMode
 */

export const NEW_LICENSE = 'Новая лицензия'
export const MAX_PRICE_ROWS = 20_000
export const MAX_KNOWLEDGE = 500

/** «Не указано», пусто, прочерк — нет значения. */
function blank(/** @type {string} */ value) {
  return /^(не указано|не указан|нет|-|—|n\/a)?$/i.test(value.trim())
}

function clean(/** @type {unknown} */ value) {
  return typeof value === 'string' ? value.replace(/\s+/g, ' ').trim() : ''
}

function norm(/** @type {string} */ value) {
  return value.toLowerCase().replaceAll('ё', 'е').replace(/\s+/g, ' ').trim()
}

/**
 * Цена из ячейки в тиынах: «12,500.00», «12 500,00», «1145337.6», «12500». Пусто, ноль и
 * непонятное — null: такая ячейка не означает бесплатную поставку.
 */
export function parsePrice(/** @type {string} */ raw) {
  let text = raw.replace(/[\s  ₸]|тг\.?|тенге/gi, '')
  if (!text) return null
  const comma = text.lastIndexOf(',')
  const dot = text.lastIndexOf('.')
  if (comma >= 0 && dot >= 0) {
    const decimal = comma > dot ? ',' : '.'
    text = text.replaceAll(decimal === ',' ? '.' : ',', '').replace(decimal, '.')
  } else if (comma >= 0)
    text = /,\d{1,2}$/.test(text) ? text.replace(',', '.') : text.replaceAll(',', '')
  else if (dot >= 0 && !/\.\d{1,2}$/.test(text)) text = text.replaceAll('.', '')
  const match = /^(\d{1,13})(?:\.(\d{1,2}))?$/.exec(text)
  if (!match) return null
  const tiyn = BigInt(match[1] ?? '0') * 100n + BigInt((match[2] ?? '').padEnd(2, '0') || '0')
  return tiyn > 0n ? tiyn.toString() : null
}

/** Дата обновления: число Excel (46294), «29.09.2026» или «2026-09-29». */
export function parseDay(/** @type {string} */ raw) {
  const text = raw.trim()
  if (/^\d{5}(\.\d+)?$/.test(text)) {
    const date = new Date(Math.round((Number(text) - 25_569) * 86_400_000))
    return Number.isNaN(date.getTime()) ? '' : date.toISOString().slice(0, 10)
  }
  const ru = /^(\d{1,2})\.(\d{1,2})\.(\d{4})/.exec(text)
  if (ru) return `${ru[3]}-${(ru[2] ?? '').padStart(2, '0')}-${(ru[1] ?? '').padStart(2, '0')}`
  const iso = /^(\d{4}-\d{2}-\d{2})/.exec(text)
  return iso?.[1] ?? ''
}

/** Срок, месяцев: 12 / «12» / «Бессрочно» / «Не указано». */
function parseTerm(/** @type {string} */ raw) {
  if (/бессроч|perpetual/i.test(raw)) return 'perpetual'
  const months = Number(raw.replace(',', '.'))
  return Number.isFinite(months) && months > 0 && months <= 120 ? Math.round(months) : null
}

/** Колонки листа прайса по заголовкам (регистр и лишние пробелы не важны). */
const PRICE_COLUMNS = /** @type {const} */ ({
  code: ['код'],
  article: ['артикул'],
  family: ['семейство продукта', 'семейство'],
  name: ['короткое название', 'наименование лицензии, оборудования', 'наименование'],
  fullName: ['полное наименование', 'полное наименование для печати'],
  purchase: ['тип покупки'],
  term: ['срок, месяцев', 'срок'],
  edition: ['редакция / комплектация', 'редакция'],
  license: ['тип лицензии'],
  seats: ['количество мест'],
  price: ['цена, тенге', 'цена'],
  status: ['статус цены'],
  delivery: ['сроки поставки', 'срок поставки'],
  updated: ['дата обновления'],
})

/**
 * @param {string[]} header
 * @returns {Record<keyof typeof PRICE_COLUMNS, number> | null}
 */
function priceColumns(header) {
  const names = header.map((cell) => norm(cell))
  /** @type {Record<string, number>} */
  const map = {}
  for (const [key, aliases] of Object.entries(PRICE_COLUMNS))
    map[key] = names.findIndex((name) => aliases.some((alias) => name === alias))
  if (map.code < 0 || map.price < 0 || (map.name < 0 && map.fullName < 0)) return null
  return /** @type {Record<keyof typeof PRICE_COLUMNS, number>} */ (map)
}

/**
 * Лист прайса из прочитанной книги (src/domain/spreadsheet.mjs): первый лист, где среди первых
 * десяти строк есть заголовки «Код» и «Цена, тенге».
 * @param {{ name: string, rows: string[][] }[]} sheets
 * @returns {{ sheet: string, rows: PriceRow[], problems: string[], updated: string } | null}
 */
export function parsePriceTable(sheets) {
  for (const sheet of sheets)
    for (let at = 0; at < Math.min(10, sheet.rows.length); at++) {
      const columns = priceColumns(sheet.rows[at] ?? [])
      if (columns) return readPriceRows(sheet.name, sheet.rows.slice(at + 1), columns, at + 2)
    }
  return null
}

/**
 * @param {string} sheet
 * @param {string[][]} lines
 * @param {Record<keyof typeof PRICE_COLUMNS, number>} col
 * @param {number} firstLine  Номер первой строки данных в Excel — для сообщений о проблемах.
 */
function readPriceRows(sheet, lines, col, firstLine) {
  /** @type {PriceRow[]} */
  const rows = []
  /** @type {string[]} */
  const problems = []
  const codes = new Set()
  const cell = (/** @type {string[]} */ line, /** @type {number} */ index) =>
    index >= 0 ? clean(line[index] ?? '') : ''
  lines.forEach((line, index) => {
    const code = cell(line, col.code)
    const name = cell(line, col.name) || cell(line, col.fullName)
    if (!code && !name) return
    const where = `строка ${firstLine + index}`
    if (!code) {
      problems.push(`${where}: нет кода — строка пропущена`)
      return
    }
    if (codes.has(code.toLowerCase())) {
      problems.push(`${where}: код ${code} повторяется — взята первая строка`)
      return
    }
    codes.add(code.toLowerCase())
    const rawPrice = cell(line, col.price)
    const tiyn = parsePrice(rawPrice)
    const request = /запрос/i.test(cell(line, col.status)) || /запрос/i.test(rawPrice)
    const status = request ? 'request' : tiyn ? 'price' : 'invalid'
    if (status === 'invalid')
      problems.push(
        `${where}: у ${code} нет корректной цены («${rawPrice || 'пусто'}») — Кадди передаст вопрос менеджеру`,
      )
    const seatsText = cell(line, col.seats)
    const seats = Number(seatsText.replace(',', '.'))
    const optional = (/** @type {number} */ index) => {
      const value = cell(line, index)
      return blank(value) ? '' : value
    }
    rows.push({
      code,
      article: optional(col.article),
      family: optional(col.family),
      name,
      fullName: cell(line, col.fullName) || name,
      purchase: optional(col.purchase),
      term: parseTerm(cell(line, col.term)),
      edition: optional(col.edition),
      license: optional(col.license),
      seats: Number.isInteger(seats) && seats > 0 ? seats : null,
      tiyn: status === 'price' ? tiyn : null,
      status,
      delivery: optional(col.delivery),
      updated: parseDay(cell(line, col.updated)),
    })
  })
  const days = rows
    .map((row) => row.updated)
    .filter(Boolean)
    .sort()
  return { sheet, rows, problems, updated: days[days.length - 1] ?? '' }
}

/**
 * База знаний (лист FAQ): строка заголовка с колонкой «Продукт», рядом колонка с текстом.
 * @param {{ name: string, rows: string[][] }[]} sheets
 * @returns {{ sheet: string, entries: KnowledgeEntry[] } | null}
 */
export function parseKnowledge(sheets) {
  for (const sheet of sheets) {
    const header = sheet.rows[0] ?? []
    const productCol = header.findIndex((cellText) => norm(cellText) === 'продукт')
    if (productCol < 0) continue
    const textCol = header.findIndex((_, index) => index !== productCol)
    if (textCol < 0) continue
    /** @type {KnowledgeEntry[]} */
    const entries = []
    for (const line of sheet.rows.slice(1)) {
      const text = String(line[textCol] ?? '')
        .replace(/\r\n?/g, '\n')
        .replace(/[ \t]+/g, ' ')
        .trim()
      if (!text || entries.some((entry) => entry.text === text)) continue
      entries.push({ product: clean(line[productCol] ?? '') || 'Все', text: text.slice(0, 2000) })
    }
    return { sheet: sheet.name, entries: entries.slice(0, MAX_KNOWLEDGE) }
  }
  return null
}

/**
 * Проверка строк, пришедших из браузера (админка разбирает файл у себя): те же типы и пределы,
 * лишнее отбрасывается. Возвращает строки или текст ошибки.
 * @param {unknown} raw
 * @returns {PriceRow[] | string}
 */
export function validatePriceRows(raw) {
  if (!Array.isArray(raw) || !raw.length) return 'В прайсе нет строк'
  if (raw.length > MAX_PRICE_ROWS) return `В прайсе больше ${MAX_PRICE_ROWS} строк`
  /** @type {PriceRow[]} */
  const rows = []
  const codes = new Set()
  const text = (/** @type {unknown} */ value, /** @type {number} */ max) =>
    typeof value === 'string' && value.length <= max ? clean(value) : null
  for (const item of raw) {
    const row =
      item && typeof item === 'object' ? /** @type {Record<string, unknown>} */ (item) : {}
    const code = text(row.code, 60)
    const name = text(row.name, 400)
    const fullName = text(row.fullName, 1000)
    if (!code || !name || fullName === null) return 'Некорректная строка прайса'
    if (codes.has(code.toLowerCase())) return `Код ${code} повторяется`
    codes.add(code.toLowerCase())
    const fields = [
      'article',
      'family',
      'purchase',
      'edition',
      'license',
      'delivery',
      'updated',
    ].map((key) => text(row[key] ?? '', 400))
    if (fields.some((value) => value === null)) return `Некорректная строка ${code}`
    const [article, family, purchase, edition, license, delivery, updated] =
      /** @type {string[]} */ (fields)
    const term = row.term === 'perpetual' || row.term === null ? row.term : Number(row.term)
    if (
      term !== 'perpetual' &&
      term !== null &&
      !(Number.isInteger(term) && term > 0 && term <= 120)
    )
      return `Некорректный срок у ${code}`
    const seats = row.seats === null ? null : Number(row.seats)
    if (seats !== null && !(Number.isInteger(seats) && seats > 0 && seats <= 100_000))
      return `Некорректное число мест у ${code}`
    const status = row.status === 'price' || row.status === 'request' ? row.status : 'invalid'
    const tiyn =
      status === 'price' && typeof row.tiyn === 'string' && /^[1-9]\d{0,14}$/.test(row.tiyn)
        ? row.tiyn
        : null
    rows.push({
      code,
      article: article ?? '',
      family: family ?? '',
      name,
      fullName: fullName || name,
      purchase: purchase ?? '',
      term: /** @type {PriceRow['term']} */ (term),
      edition: edition ?? '',
      license: license ?? '',
      seats,
      tiyn,
      status: status === 'price' && !tiyn ? 'invalid' : status,
      delivery: delivery ?? '',
      updated: /^\d{4}-\d{2}-\d{2}$/.test(updated ?? '') ? (updated ?? '') : '',
    })
  }
  return rows
}

/**
 * Записи базы знаний из браузера: продукт до 100 знаков, текст до 2000.
 * @param {unknown} raw
 * @returns {KnowledgeEntry[] | string}
 */
export function validateKnowledge(raw) {
  if (!Array.isArray(raw)) return 'Некорректная база знаний'
  if (raw.length > MAX_KNOWLEDGE) return `В базе знаний больше ${MAX_KNOWLEDGE} записей`
  /** @type {KnowledgeEntry[]} */
  const entries = []
  for (const item of raw) {
    const entry =
      item && typeof item === 'object' ? /** @type {Record<string, unknown>} */ (item) : {}
    const product = typeof entry.product === 'string' ? clean(entry.product) : ''
    const text = typeof entry.text === 'string' ? entry.text.trim() : ''
    if (!text || text.length > 2000 || product.length > 100)
      return 'Некорректная запись базы знаний'
    entries.push({ product: product || 'Все', text })
  }
  return entries
}

// ---------- поиск ----------

/** Разговорные названия → как в прайсе. Ключ — слово клиента или его начало; ищется любой вариант. */
const SYNONYMS = /** @type {const} */ ([
  ['автокад', ['autocad']],
  ['ревит', ['revit']],
  ['фьюж', ['fusion']],
  ['инвентор', ['inventor']],
  ['сивил', ['civil']],
  ['цивил', ['civil']],
  ['навис', ['navisworks']],
  ['скад', ['scad']],
  ['офис', ['office', 'офис']],
  ['лира', ['lira', 'лира']],
  ['нанокад', ['nanocad', 'нанокад']],
  ['гео5', ['geo5']],
  ['вирей', ['vray']],
  ['виреи', ['vray']],
  ['артек', ['artec']],
  ['майя', ['maya']],
  ['abc', ['авс', 'abc']],
  ['лт', ['lt']],
])

/** Слова, которые ничего не различают в прайсе. */
const STOP = new Set(
  'на для и в во с со по от до из к у о а или лицензия лицензии лицензию программа программу программы цена цену стоимость сколько стоит купить нужен нужна нужно нужны хочу прайс'.split(
    ' ',
  ),
)

/** Слова строки для поиска: «AutoCAD LT 2027» → autocad, lt, 2027; «V-Ray» → v, ray, vray. */
function words(/** @type {string} */ text) {
  const base = norm(text)
  const split = base.split(/[^a-zа-я0-9]+/).filter(Boolean)
  const joined = base
    .split(/[^a-zа-я0-9-]+/)
    .filter((w) => w.includes('-'))
    .map((w) => w.replaceAll('-', ''))
  return [...split, ...joined]
}

/** Код или артикул без пробелов, дефисов и регистра: «C1RK1-WW1762-L158» → c1rk1ww1762l158. */
function idKey(/** @type {string} */ value) {
  return norm(value).replace(/[\s-]+/g, '')
}

/**
 * Слова запроса: без служебных, разговорные названия — вариантами. Каждый элемент — список
 * вариантов, достаточно совпадения любого.
 */
export function queryWords(/** @type {string} */ query) {
  return words(query)
    .filter((word) => !STOP.has(word))
    .map((word) => {
      // Короткие ключи («лт», «abc») — только целым словом, длинные — и началом слова.
      const synonym = SYNONYMS.find(
        ([from]) => word === from || (from.length >= 4 && word.startsWith(from)),
      )
      return synonym ? [...synonym[1]] : [word]
    })
}

/**
 * @typedef {object} PriceFilters
 * @property {string} [query]
 * @property {string} [purchase]  Часть типа покупки: «новая», «продление», «обновление».
 * @property {number | 'perpetual'} [term]
 * @property {string} [edition]
 * @property {string} [license]
 */

/** Индекс прайса: слова семейства, названий и кода по строке. Строится один раз на прайс. */
export function indexPriceRows(/** @type {PriceRow[]} */ rows) {
  return rows.map((row) => ({
    row,
    family: new Set(words(row.family)),
    // Последнее слово семейства — сам продукт («Autodesk Revit» → revit), а не плагин к нему
    // («Revit - PCF» → pcf): при равных совпадениях продукт выше плагинов.
    core:
      norm(row.family)
        .split(/[^a-zа-я0-9]+/)
        .filter(Boolean)
        .at(-1) ?? '',
    strong: new Set(words(`${row.family} ${row.name}`)),
    weak: new Set(words(`${row.fullName} ${row.edition} ${row.license}`)),
    ids: new Set([idKey(row.code), idKey(row.article)].filter(Boolean)),
  }))
}

/** @typedef {ReturnType<typeof indexPriceRows>} PriceIndex */

function hit(/** @type {Set<string>} */ set, /** @type {string[]} */ variants) {
  for (const item of set) if (variants.some((word) => item.startsWith(word))) return true
  return false
}

/**
 * Поиск по прайсу. Запрос — точный код или артикул (тогда только эта строка) либо слова: все
 * должны найтись в семействе, названиях, редакции или типе лицензии. Фильтры — по колонкам.
 * Выше — совпадения в семействе и названии, потом новые лицензии, потом короткие названия.
 * Возвращает до limit строк, сколько нашлось всего и все найденные (для списка вариантов).
 * @param {PriceIndex} index
 * @param {PriceFilters} filters
 */
export function searchPriceIndex(index, filters, limit = 12) {
  const query = filters.query ?? ''
  const exact = idKey(query)
  const byId = exact.length >= 4 ? index.filter((item) => item.ids.has(exact)) : []
  const terms = queryWords(query)
  const purchase = filters.purchase ? norm(filters.purchase) : ''
  const edition = filters.edition ? norm(filters.edition) : ''
  const license = filters.license ? norm(filters.license) : ''
  /** @type {{ row: PriceRow, score: number }[]} */
  const found = []
  for (const item of byId.length ? byId : index) {
    const { row } = item
    if (purchase && !norm(row.purchase).includes(purchase.slice(0, 6))) continue
    if (filters.term !== undefined && row.term !== filters.term) continue
    if (edition && !norm(row.edition).includes(edition)) continue
    if (license && !norm(row.license).includes(license)) continue
    let score = 0
    let all = true
    if (!byId.length)
      for (const variants of terms) {
        if (variants.some((word) => item.core.startsWith(word))) score += 7
        else if (hit(item.family, variants)) score += 5
        else if (hit(item.strong, variants)) score += 3
        else if (hit(item.weak, variants)) score += 1
        else {
          all = false
          break
        }
      }
    if (!all) continue
    if (row.purchase === NEW_LICENSE) score += 0.5
    found.push({ row, score })
  }
  found.sort((a, b) => b.score - a.score || a.row.name.length - b.row.name.length)
  const all = found.map((f) => f.row)
  return { total: all.length, rows: all.slice(0, limit), all }
}

/** Разные значения колонки у найденных строк: что ещё различает варианты. */
export function distinct(
  /** @type {PriceRow[]} */ rows,
  /** @type {(row: PriceRow) => string} */ pick,
  max = 12,
) {
  /** @type {string[]} */
  const values = []
  for (const row of rows) {
    const value = pick(row)
    if (value && !values.includes(value)) values.push(value)
    if (values.length >= max) break
  }
  return values
}

// ---------- цена, единица, срок поставки ----------

/** Срок лицензии словами. Нет срока в прайсе — не бессрочная, а «не указан». */
export function termText(/** @type {PriceRow['term']} */ term) {
  if (term === 'perpetual') return 'бессрочная'
  if (term === null) return 'срок в прайсе не указан'
  if (term % 12 === 0) {
    const years = term / 12
    return `на ${years} ${years === 1 ? 'год' : years < 5 ? 'года' : 'лет'}`
  }
  return `на ${term} мес.`
}

/** Оборудование и расходники: цены и сроки — через менеджера. */
export function isEquipment(/** @type {PriceRow} */ row) {
  if (/оборудование|расходн/i.test(row.purchase)) return true
  return /плоттер|принтер|сканер|scanner|картридж|чернил|plotwave|colorwave|widetek/i.test(
    `${row.family} ${row.name}`,
  )
}

/**
 * Срок поставки по утверждённым условиям (раздел 7 правил): AutoCAD — до двух рабочих дней
 * (только AutoCAD и AutoCAD LT, не весь Autodesk), АВС и РСНБ — 5–7 рабочих дней, сканеры и
 * плоттеры — через менеджера. Остальное — срок из прайса.
 */
export function deliveryTerm(/** @type {PriceRow} */ row) {
  if (isEquipment(row)) return 'уточняет менеджер'
  if (/^(autodesk\s+)?autocad(\s+lt)?$/i.test(row.family)) return 'до двух рабочих дней'
  if (
    /^(авс|рснб)(?![а-яёa-z0-9])/i.test(row.family) ||
    /^(авс|рснб)(?![а-яёa-z0-9])/i.test(row.name)
  )
    return '5–7 рабочих дней'
  return row.delivery || 'уточняет менеджер'
}

/** Единица цены: место, пакет мест или лицензия. */
export function priceUnit(/** @type {PriceRow} */ row) {
  if (row.seats && row.seats > 1) return `за пакет на ${row.seats} мест`
  if (row.seats === 1) return 'за 1 место'
  return 'за 1 лицензию'
}

/**
 * Можно ли Кадди самому назвать цену строки (раздел 5): только новая лицензия ПО с числовой ценой.
 * Иначе — почему нельзя (это уходит модели вместо цены).
 * @returns {{ ok: true } | { ok: false, reason: string }}
 */
export function canTellPrice(/** @type {PriceRow} */ row) {
  if (isEquipment(row))
    return { ok: false, reason: 'Цену оборудования и расходных материалов уточняет менеджер' }
  if (row.purchase !== NEW_LICENSE)
    return {
      ok: false,
      reason: `Это не новая лицензия (${row.purchase || 'тип покупки не указан'}): цену уточняет менеджер`,
    }
  if (row.status === 'request') return { ok: false, reason: 'Цена по запросу — уточняет менеджер' }
  if (row.status !== 'price' || !row.tiyn)
    return { ok: false, reason: 'В прайсе нет корректной цены — уточняет менеджер' }
  return { ok: true }
}

/** Сумма в тенге: «1 200 000 ₸», с тиынами — «1 145 337,60 ₸». Без округления. */
export function formatTiyn(/** @type {string} */ tiyn) {
  const value = BigInt(tiyn)
  const tenge = (value / 100n).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ')
  const rest = value % 100n
  return `${tenge}${rest ? `,${rest.toString().padStart(2, '0')}` : ''} ₸`
}

/** НДС словами для ответа: известен ли он по загрузке прайса. */
export function vatText(/** @type {VatMode} */ vat) {
  if (vat === 'included') return 'с НДС'
  if (vat === 'excluded') return 'без НДС'
  return 'включён ли НДС — не указано, это требует уточнения'
}

// ---------- рабочее время ----------

const DAYS = ['воскресенье', 'понедельник', 'вторник', 'среда', 'четверг', 'пятница', 'суббота']

/**
 * Рабочее время офиса в Астане (UTC+5): будни 09:00–18:00, обед 13:00–14:00.
 * Праздничные дни сайт не знает — это сказано модели.
 * @param {Date} now
 */
export function workTime(now) {
  const local = new Date(now.getTime() + 5 * 3_600_000)
  const day = local.getUTCDay()
  const minutes = local.getUTCHours() * 60 + local.getUTCMinutes()
  const clock = `${String(local.getUTCHours()).padStart(2, '0')}:${String(local.getUTCMinutes()).padStart(2, '0')}`
  const date = local.toISOString().slice(0, 10).split('-').reverse().join('.')
  /** @type {'work' | 'lunch' | 'off'} */
  let state = 'off'
  if (day >= 1 && day <= 5 && minutes >= 540 && minutes < 1080)
    state = minutes >= 780 && minutes < 840 ? 'lunch' : 'work'
  return { state, text: `${DAYS[day]}, ${date}, ${clock} по времени Астаны` }
}
