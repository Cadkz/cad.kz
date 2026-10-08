// Чтение выгрузок старого сайта на 1С-Битрикс: CSV из «Экспорт инфоблока» и «Excel» из списка
// в админке (на деле это HTML-таблица). Только разбор текста, без сети и базы.

/** CSV с разделителем «;», кавычками и переносами строк внутри значений. */
export function parseCsv(text, delimiter = ';') {
  const source = text.replace(/^\uFEFF/, '')
  const rows = []
  let row = []
  let cell = ''
  let i = 0
  const endCell = () => {
    row.push(cell)
    cell = ''
  }
  while (i < source.length) {
    const ch = source[i]
    if (ch === '"' && cell === '') {
      const close = readQuoted(source, i + 1)
      cell = close.value
      i = close.next
      continue
    }
    if (ch === delimiter) endCell()
    else if (ch === '\n' || ch === '\r') {
      endCell()
      rows.push(row)
      row = []
    } else cell += ch
    i += ch === '\r' && source[i + 1] === '\n' ? 2 : 1
  }
  if (cell !== '' || row.length) {
    endCell()
    rows.push(row)
  }
  return toRecords(rows.filter((r) => r.some((value) => value !== '')))
}

/** Значение в кавычках: "" внутри — это одна кавычка. Возвращает текст и позицию после него. */
function readQuoted(source, from) {
  let value = ''
  let i = from
  while (i < source.length) {
    if (source[i] === '"' && source[i + 1] === '"') {
      value += '"'
      i += 2
    } else if (source[i] === '"') return { value, next: i + 1 }
    else value += source[i++]
  }
  return { value, next: i }
}

const ENTITIES = { nbsp: '\u00a0', quot: '"', amp: '&', lt: '<', gt: '>', apos: "'", euro: '€' }

export function decodeEntities(text) {
  return text.replace(/&(#x[0-9a-f]+|#\d+|[a-z]+);/gi, (whole, name) => {
    if (name[0] === '#')
      return String.fromCodePoint(
        name[1] === 'x' || name[1] === 'X'
          ? Number.parseInt(name.slice(2), 16)
          : Number(name.slice(1)),
      )
    return ENTITIES[name.toLowerCase()] ?? whole
  })
}

/** «Excel»-выгрузка списка Битрикса: HTML с одной таблицей, первая строка — заголовки. */
export function parseExcelHtml(text) {
  const rows = []
  for (const tr of text.matchAll(/<tr[^>]*>([\s\S]*?)<\/tr>/gi)) {
    const cells = [...tr[1].matchAll(/<td[^>]*>([\s\S]*?)<\/td>/gi)].map((td) =>
      decodeEntities(td[1].replace(/<br\s*\/?>/gi, '\n').replace(/<[^>]+>/g, '')).trim(),
    )
    rows.push(cells)
  }
  return toRecords(rows)
}

function toRecords(rows) {
  const [header = [], ...body] = rows
  const columns = header.map((name) => name.trim())
  return {
    columns,
    records: body.map((cells) => Object.fromEntries(columns.map((c, i) => [c, cells[i] ?? '']))),
  }
}

/**
 * Что за файл, по заголовкам, а не по имени: имена у выгрузок Битрикса случайные.
 * productsCsv — каталог (разделы IC_GROUP), offersCsv — предложения (привязка PROP31),
 * offerPrices / productPrices — списки из админки с колонкой «Розничная цена».
 */
export function detectKind(columns) {
  const has = (name) => columns.includes(name)
  if (has('IE_ID') && has('IP_PROP31')) return 'offersCsv'
  if (has('IE_ID') && has('IC_GROUP0')) return 'productsCsv'
  if (has('ID') && has('Розничная цена') && has('Элемент каталога')) return 'offerPrices'
  if (has('ID') && has('Розничная цена')) return 'productPrices'
  return null
}
