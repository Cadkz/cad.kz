// @ts-check
import { autodeskPrices } from './vendorPrices.mjs'
// Прайс-лист производителя для Кадди (просьба владельца 29.10.2026): что вообще можно поставить,
// даже если товара нет в каталоге сайта. Первый — прайс-лист Autodesk на месяц (.xlsx: колонки
// «Программное обеспечение», «SKU код», «РЦКП»; строки без SKU — заголовки групп; вверху
// «Effective: October 7, 2026 - November 6, 2026»). Цены из файла Кадди не получает: цены —
// только из прайса CAD.kz, здесь только наличие и способы покупки. Чистые функции без базы.

/**
 * @typedef {{ name: string, cloud: boolean, options: string[] }} VendorProduct
 * @typedef {{ vendor: string, from: string, to: string, products: VendorProduct[] }} VendorList
 * @typedef {import('./vendorPrices.mjs').VendorPrices} VendorPrices
 */

export const MAX_VENDOR_PRODUCTS = 400

/** Состояние записи прайс-листа производителя в коллекции price-tables (рядом с прайсом CAD.kz). */
export const VENDOR_STATE = 'vendor-active'

const MONTHS = {
  january: '01',
  february: '02',
  march: '03',
  april: '04',
  may: '05',
  june: '06',
  july: '07',
  august: '08',
  september: '09',
  october: '10',
  november: '11',
  december: '12',
}

/** «October 7, 2026» → 2026-10-07; непонятное — «». */
function englishDay(/** @type {string} */ text) {
  const match = /([a-z]+)\s+(\d{1,2}),\s*(\d{4})/i.exec(text)
  if (!match) return ''
  const month = MONTHS[/** @type {keyof typeof MONTHS} */ ((match[1] ?? '').toLowerCase())]
  return month ? `${match[3]}-${month}-${(match[2] ?? '').padStart(2, '0')}` : ''
}

/**
 * Название для людей: «Navisworks Manage 2027» → «Navisworks Manage», «… Collection IC» →
 * «… Collection», «Fusion CLOUD» → «Fusion» (облачный — отдельным признаком).
 * @param {string} heading
 */
export function vendorProductName(heading) {
  return heading
    .replace(/\s+(CLOUD|SUB|IC|AD)$/i, '')
    .replace(/\s+20\d\d$/, '')
    .replace(/\s+/g, ' ')
    .trim()
}

/**
 * Новые сетевые (multi-user) лицензии Autodesk не продаёт с 2020 года, в прайс-листе они только
 * в строках для владельцев старых сетевых. Раньше писалось «есть сетевые (multi-user)», и Кадди
 * предлагал их клиентам как новую покупку (отчёт «Проверки Кадди» 30.10.2026).
 */
export const MULTI_OLD = 'новых сетевых (multi-user) нет, только для владельцев старых сетевых'
const MULTI_LEGACY = 'есть сетевые (multi-user)'

/**
 * Способы покупки по строкам с SKU одного продукта: новая подписка (сроки), продление, переход.
 * @param {string[]} names
 */
export function purchaseOptions(names) {
  /** @type {Set<string>} */
  const terms = new Set()
  let renewal = false
  let switched = false
  let multi = false
  let multiNew = false
  for (const name of names) {
    if (/\bnew\b/i.test(name)) {
      if (/multi-user/i.test(name)) multiNew = true
      if (/annual/i.test(name)) terms.add('1 год')
      if (/2-year/i.test(name)) terms.add('2 года')
      if (/3-year/i.test(name)) terms.add('3 года')
      if (/monthly/i.test(name)) terms.add('месяц')
    }
    if (/renewal/i.test(name)) renewal = true
    if (/switched/i.test(name)) switched = true
    if (/multi-user/i.test(name)) multi = true
  }
  const order = ['месяц', '1 год', '2 года', '3 года']
  const list = order.filter((term) => terms.has(term))
  /** @type {string[]} */
  const options = []
  if (list.length) options.push(`новая подписка: ${list.join(', ')}`)
  else options.push('новых подписок нет, только для действующих клиентов')
  if (renewal) options.push('продление')
  if (switched) options.push('переход со старых лицензий')
  if (multiNew) options.push('новые сетевые (multi-user)')
  else if (multi) options.push(MULTI_OLD)
  return options
}

/**
 * Прайс-лист Autodesk из таблицы: лист с колонками «SKU» и «РЦКП». null — это не он.
 * Цены (РЦКП) — отдельно, в prices: только для товаров сайта (src/domain/vendorPrices.mjs), в
 * список для Кадди они не попадают.
 * @param {{ name: string, rows: string[][] }[]} sheets
 * @returns {(VendorList & { prices: VendorPrices }) | null}
 */
export function parseAutodeskList(sheets) {
  for (const sheet of sheets) {
    const headerRow = sheet.rows.findIndex(
      (row) => row.some((cell) => /sku/i.test(cell)) && row.some((cell) => /рцкп/i.test(cell)),
    )
    if (headerRow < 0) continue
    const header = sheet.rows[headerRow] ?? []
    const skuCol = header.findIndex((cell) => /sku/i.test(cell))
    const priceCol = header.findIndex((cell) => /рцкп/i.test(cell))
    const effective = sheet.rows
      .slice(0, headerRow)
      .flat()
      .find((cell) => /effective/i.test(cell))
    const [fromText = '', toText = ''] = (effective ?? '').split(/\s+-\s+/)
    const body = sheet.rows
      .slice(headerRow + 1)
      .map((row) => ({
        name: String(row[0] ?? '').trim(),
        sku: String(row[skuCol] ?? '').trim(),
        price: String(row[priceCol] ?? '').trim(),
      }))
      .filter((row) => row.name)
    const headings = body.filter((row) => !row.sku).map((row) => row.name)
    // Продукт — заголовок, за которым идёт заголовок, начинающийся с него («Revit 2027» →
    // «Revit 2027 Commercial New»). Строки с SKU относятся к последнему продукту выше.
    const tops = new Set(
      headings.filter((name, index) => (headings[index + 1] ?? '').startsWith(`${name} `)),
    )
    /** @type {Map<string, { cloud: boolean, names: string[] }>} */
    const byName = new Map()
    let current = ''
    for (const row of body) {
      if (!row.sku) {
        if (tops.has(row.name)) current = row.name
        continue
      }
      if (!current) continue
      const name = vendorProductName(current)
      const entry = byName.get(name) ?? { cloud: /\bCLOUD$/i.test(current), names: [] }
      entry.names.push(row.name)
      byName.set(name, entry)
    }
    if (!byName.size) return null
    const products = [...byName.entries()]
      .map(([name, entry]) => ({ name, cloud: entry.cloud, options: purchaseOptions(entry.names) }))
      .sort((a, b) => a.name.localeCompare(b.name, 'en'))
      .slice(0, MAX_VENDOR_PRODUCTS)
    return {
      vendor: 'Autodesk',
      from: englishDay(fromText),
      to: englishDay(toText),
      products,
      prices: autodeskPrices(body.filter((row) => row.sku)),
    }
  }
  return null
}

/**
 * Проверка списка, пришедшего из браузера. Возвращает список или текст ошибки.
 * @param {unknown} raw
 * @returns {VendorList | string}
 */
export function validateVendorList(raw) {
  const data = raw && typeof raw === 'object' ? /** @type {Record<string, unknown>} */ (raw) : {}
  const day = (/** @type {unknown} */ value) =>
    typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value) ? value : ''
  if (data.vendor !== 'Autodesk') return 'Неизвестный производитель'
  if (!Array.isArray(data.products) || !data.products.length) return 'В прайс-листе нет продуктов'
  if (data.products.length > MAX_VENDOR_PRODUCTS) return 'Слишком много продуктов'
  /** @type {VendorProduct[]} */
  const products = []
  for (const item of data.products) {
    const entry =
      item && typeof item === 'object' ? /** @type {Record<string, unknown>} */ (item) : {}
    const name = typeof entry.name === 'string' ? entry.name.trim() : ''
    const options = Array.isArray(entry.options)
      ? entry.options.filter((option) => typeof option === 'string' && option.length <= 80)
      : []
    if (!name || name.length > 120 || options.length > 6) return 'Некорректная строка прайс-листа'
    products.push({ name, cloud: entry.cloud === true, options })
  }
  return { vendor: 'Autodesk', from: day(data.from), to: day(data.to), products }
}

const ru = (/** @type {string} */ day) => (day ? day.split('-').reverse().join('.') : '?')

/**
 * Раздел правил модели: что можно поставить. Цен нет — их Кадди берёт только из прайса CAD.kz.
 * @param {VendorList | null} list
 */
export function vendorListText(list) {
  if (!list) return ''
  const lines = list.products
    .map(
      (product) =>
        `— ${product.name}${product.cloud ? ' (облачный)' : ''}: ${product.options
          // Прайс-лист, загруженный до 30.10.2026, хранит старую формулировку.
          .map((option) => (option === MULTI_LEGACY ? MULTI_OLD : option))
          .join('; ')}`,
    )
    .join('\n')
  return `

Что CAD.kz может поставить от ${list.vendor} — прайс-лист производителя, действует с ${ru(list.from)} по ${ru(list.to)}. Это все продукты, которые сейчас продаёт ${list.vendor}, в том числе которых нет на сайте. Если клиент спрашивает, можно ли купить продукт ${list.vendor}, отвечай по этому списку: есть — можем поставить, детали и цену подготовит менеджер. Нет в списке — сначала найди его в каталоге сайта: многие программы продаются только в составе коллекций (например, Robot Structural Analysis, Forma Building Design, Twinmotion for Revit, Vault Basic) — тогда предложи коллекцию, где он есть; нет и там — ${list.vendor} его сейчас не продаёт, предложи замену из списка или менеджера. Цены отсюда не называй — только из прайса CAD.kz.
${lines}`
}
