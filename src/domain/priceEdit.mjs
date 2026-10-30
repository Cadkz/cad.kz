// Правка цен в админке: таблица предложений («Цены таблицей») и курсы одной страницей.
// Без зависимостей от Payload, чтобы правила проверялись тестами (tests/priceEdit.test.mjs).
// Сами цены в тенге считает только сервер (src/domain/pricing.mjs).

/** Изменение цены больше этого — просим подтвердить отдельно (решение владельца 15.10.2026). */
export const BIG_CHANGE_PERCENT = 30

/** Цена в исходной валюте, как её хранит предложение: «1145337.6». */
export const AMOUNT = /^\d{1,12}(\.\d{1,6})?$/

/** Курс: тенге за единицу, «550» или «6.12». */
export const RATE = /^\d{1,6}(\.\d{1,6})?$/

/** @type {('KZT' | 'USD' | 'EUR' | 'RUB')[]} */
export const CURRENCIES = ['KZT', 'USD', 'EUR', 'RUB']
/** @type {('USD' | 'EUR' | 'RUB')[]} */
export const RATE_CURRENCIES = ['USD', 'EUR', 'RUB']

/**
 * Число, как его вводят люди: «1 145 337,6», «550.» → строка для базы или null, если это не число.
 * Ноль разрешён: так у предложения обозначена цена по запросу.
 * @param {string} text
 * @param {RegExp} [pattern]
 */
export function parseAmount(text, pattern = AMOUNT) {
  const clean = String(text ?? '')
    .replace(/[\s  ]/g, '')
    .replace(',', '.')
    .replace(/\.$/, '')
  if (!pattern.test(clean)) return null
  // Без лишних нулей: «0550.50» → «550.5», чтобы «то же самое число» не считалось правкой.
  const [whole, fraction = ''] = clean.split('.')
  const int = whole.replace(/^0+(?=\d)/, '')
  const frac = fraction.replace(/0+$/, '')
  return frac ? `${int}.${frac}` : int
}

/**
 * Насколько изменилась цена в тенге: «+12 %», «−3 %». Цены — целые тенге строкой с сервера.
 * null — сравнивать не с чем (нет одной из цен или они равны).
 * @param {string | null | undefined} fromKzt
 * @param {string | null | undefined} toKzt
 */
export function priceChange(fromKzt, toKzt) {
  if (!fromKzt || !toKzt || fromKzt === toKzt) return null
  const from = Number(fromKzt)
  const to = Number(toKzt)
  if (!from) return { percent: null, text: 'было 0', big: true }
  const exact = ((to - from) / from) * 100
  // Округление до целого, но не до нуля: +0,4 % показываем как «+0,4 %», а не «0 %».
  const percent = Math.abs(exact) < 1 ? Math.round(exact * 10) / 10 : Math.round(exact)
  const sign = exact > 0 ? '+' : '−'
  const shown = String(Math.abs(percent)).replace('.', ',')
  return { percent, text: `${sign}${shown} %`, big: Math.abs(exact) > BIG_CHANGE_PERCENT }
}

/**
 * Строки таблицы цен по фильтрам. Поиск — по всем словам в названии товара и комплектации.
 * group — вкладка (ПО / оборудование / услуги), vendor — папка производителя: число или «none»
 * (товары без производителя).
 * @template {{ label: string, vendor: number | null, section: number | null, currency: string,
 *   published: boolean, noPrice: boolean, id: number, group?: string }} Row
 * @param {Row[]} rows
 * @param {{ query?: string, group?: string | null, vendor?: number | 'none' | null,
 *   section?: number | null, currency?: string, status?: 'all' | 'published' | 'draft',
 *   noPrice?: boolean, edited?: Set<number> | null }} filter
 * @returns {Row[]}
 */
export function filterPriceRows(rows, filter) {
  const words = normal(filter.query ?? '')
    .split(/\s+/)
    .filter(Boolean)
  const status = filter.status ?? 'all'
  const vendor = filter.vendor ?? null
  /** @type {((row: Row) => boolean)[]} */
  const tests = [
    (row) => !filter.group || row.group === filter.group,
    (row) => vendor === null || row.vendor === (vendor === 'none' ? null : vendor),
    (row) => filter.section == null || row.section === filter.section,
    (row) => !filter.currency || row.currency === filter.currency,
    (row) => status === 'all' || row.published === (status === 'published'),
    (row) => !filter.noPrice || row.noPrice,
    (row) => !filter.edited || filter.edited.has(row.id),
    (row) => {
      const text = normal(`${row.label} ${row.id}`)
      return words.every((word) => text.includes(word))
    },
  ]
  return rows.filter((row) => tests.every((test) => test(row)))
}

/**
 * Папки производителей во вкладке «Цен», как в «Каталоге» (пожелание владельца 30.10.2026):
 * сколько товаров и комплектаций, сколько из них без цены. Порядок — по названию производителя,
 * «Без производителя» — последней.
 * @param {{ vendor: number | null, productId: number, noPrice: boolean }[]} rows
 * @param {Map<number, string>} titles — названия производителей
 * @returns {{ vendor: number | 'none', title: string, products: number, offers: number,
 *   noPrice: number }[]}
 */
export function priceFolders(rows, titles) {
  /** @type {Map<number | 'none', { products: Set<number>, offers: number, noPrice: number }>} */
  const byVendor = new Map()
  for (const row of rows) {
    const key = row.vendor ?? 'none'
    const folder = byVendor.get(key) ?? { products: new Set(), offers: 0, noPrice: 0 }
    folder.products.add(row.productId)
    folder.offers += 1
    if (row.noPrice) folder.noPrice += 1
    byVendor.set(key, folder)
  }
  const title = (/** @type {number | 'none'} */ key) =>
    key === 'none' ? 'Без производителя' : (titles.get(key) ?? `Производитель ${key}`)
  return [...byVendor]
    .map(([vendor, folder]) => ({
      vendor,
      title: title(vendor),
      products: folder.products.size,
      offers: folder.offers,
      noPrice: folder.noPrice,
    }))
    .sort(
      (a, b) =>
        Number(a.vendor === 'none') - Number(b.vendor === 'none') ||
        a.title.localeCompare(b.title, 'ru', { numeric: true }),
    )
}

/**
 * Сколько строк в каждой вкладке — чтобы при поиске подсказать: «ещё нашлось в Оборудовании».
 * @param {{ group?: string }[]} rows
 * @returns {Record<string, number>}
 */
export function countByGroup(rows) {
  /** @type {Record<string, number>} */
  const counts = {}
  for (const row of rows) {
    const key = row.group ?? ''
    counts[key] = (counts[key] ?? 0) + 1
  }
  return counts
}

/** Для поиска: нижний регистр, «ё» как «е». */
function normal(text) {
  return String(text).toLowerCase().replace(/ё/g, 'е')
}

/** Журнал: «Цены таблицей: изменено 12, из них больше 30 % — 2; не записано 1 (правили другие)». */
export function priceEditSummary({ changed, big = 0, conflicts = 0 }) {
  const bigText = big ? `, из них больше ${BIG_CHANGE_PERCENT} % — ${big}` : ''
  const conflictText = conflicts ? `; не записано ${conflicts} (цену уже поменяли)` : ''
  return `Цены таблицей: изменено ${changed}${bigText}${conflictText}`
}

const DAY = 86_400_000
const ASTANA = 5 * 3_600_000

/** Сегодня по Астане: «2026-10-15». */
export function todayInAstana(now = new Date()) {
  return new Date(now.getTime() + ASTANA).toISOString().slice(0, 10)
}

/**
 * Когда начинает действовать новый курс. Сегодня — с этой минуты (иначе он встанет раньше уже
 * введённого сегодня курса и не вступит в силу), будущий день — с полуночи по Астане.
 * Прошлые дни нельзя: у уже рассчитанных цен должен оставаться их курс.
 * @param {string} day «2026-10-20»
 * @returns {{ at: string } | { error: string }}
 */
export function rateStart(day, now = new Date()) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(String(day))) return { error: 'Укажите дату «Действует с»' }
  const today = todayInAstana(now)
  if (day < today) return { error: 'Курс задним числом не вводится: выберите сегодня или позже' }
  if (day === today) return { at: now.toISOString() }
  const midnight = Date.parse(`${day}T00:00:00Z`) - ASTANA
  if (Number.isNaN(midnight) || midnight - now.getTime() > 366 * DAY)
    return { error: 'Дата «Действует с» — не дальше чем через год' }
  return { at: new Date(midnight).toISOString() }
}
