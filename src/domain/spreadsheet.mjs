/**
 * Чтение таблицы прайса без библиотек: Excel (.xlsx), CSV и «Excel» в виде HTML-таблицы.
 * Работает в браузере (файл никуда не загружается) и в Node для тестов. Результат — листы
 * со строками ячеек-строк, без попытки угадать заголовки: это делает src/domain/priceList.mjs.
 *
 * .xlsx — это zip с XML внутри. Распаковка встроенным DecompressionStream('deflate-raw'),
 * разбор XML — регулярными выражениями: в листах Excel простая и предсказуемая разметка.
 */
import { decodeEntities } from './bitrixFiles.mjs'

/** @typedef {{ name: string, rows: string[][] }} Sheet */

export class SpreadsheetError extends Error {}

const MAX_ROWS = 20_000

/**
 * @param {Uint8Array} bytes
 * @returns {Promise<Sheet[]>}
 */
export async function readSpreadsheet(bytes) {
  if (bytes[0] === 0x50 && bytes[1] === 0x4b) return readXlsx(bytes)
  if (bytes[0] === 0xd0 && bytes[1] === 0xcf)
    throw new SpreadsheetError(
      'Это старый формат Excel (.xls). Откройте файл в Excel и сохраните как «Книга Excel (.xlsx)».',
    )
  const text = decodeText(bytes)
  if (/<table[\s>]/i.test(text)) return [{ name: 'Таблица', rows: htmlRows(text) }]
  return [{ name: 'Таблица', rows: csvRows(text) }]
}

/** UTF-8, а если файл в Windows-1251 (так сохраняет русский Excel CSV) — она. */
function decodeText(bytes) {
  try {
    return new TextDecoder('utf-8', { fatal: true }).decode(bytes)
  } catch {
    return new TextDecoder('windows-1251').decode(bytes)
  }
}

// ---------- zip ----------

/**
 * Файлы архива: имя → функция, которая распаковывает содержимое в текст.
 * @param {Uint8Array} bytes
 */
function zipEntries(bytes) {
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength)
  let end = -1
  for (let i = bytes.length - 22; i >= Math.max(0, bytes.length - 65_557); i--)
    if (view.getUint32(i, true) === 0x06054b50) {
      end = i
      break
    }
  if (end < 0) throw new SpreadsheetError('Файл повреждён или это не Excel (.xlsx).')
  const count = view.getUint16(end + 10, true)
  let at = view.getUint32(end + 16, true)
  /** @type {Map<string, () => Promise<string>>} */
  const entries = new Map()
  for (let n = 0; n < count; n++) {
    if (view.getUint32(at, true) !== 0x02014b50) break
    const method = view.getUint16(at + 10, true)
    const size = view.getUint32(at + 20, true)
    const nameLength = view.getUint16(at + 28, true)
    const extra = view.getUint16(at + 30, true)
    const comment = view.getUint16(at + 32, true)
    const local = view.getUint32(at + 42, true)
    const name = new TextDecoder().decode(bytes.subarray(at + 46, at + 46 + nameLength))
    const dataAt = local + 30 + view.getUint16(local + 26, true) + view.getUint16(local + 28, true)
    const data = bytes.subarray(dataAt, dataAt + size)
    entries.set(name, () => inflate(data, method))
    at += 46 + nameLength + extra + comment
  }
  return entries
}

/** @param {Uint8Array} data @param {number} method */
async function inflate(data, method) {
  if (method === 0) return new TextDecoder().decode(data)
  if (method !== 8) throw new SpreadsheetError('Неизвестное сжатие внутри файла Excel.')
  const stream = new Blob([data]).stream().pipeThrough(new DecompressionStream('deflate-raw'))
  return new Response(stream).text()
}

// ---------- xlsx ----------

const xmlText = (/** @type {string} */ value) => decodeEntities(value.replace(/<[^>]+>/g, ''))

/** @param {string} xml */
function sharedStrings(xml) {
  return [...xml.matchAll(/<si>([\s\S]*?)<\/si>/g)].map((si) =>
    [...si[1].replace(/<rPh[\s\S]*?<\/rPh>/g, '').matchAll(/<t[^>]*>([\s\S]*?)<\/t>/g)]
      .map((t) => decodeEntities(t[1]))
      .join(''),
  )
}

/** Номер колонки по адресу ячейки: A → 0, Z → 25, AA → 26. */
function columnIndex(ref) {
  let index = 0
  for (const ch of ref.replace(/\d+$/, '')) index = index * 26 + ch.charCodeAt(0) - 64
  return index - 1
}

/** Число из ячейки без хвостов двоичной арифметики: 1234.4999999999 → 1234.5. */
function cleanNumber(raw) {
  const number = Number(raw)
  if (!Number.isFinite(number)) return raw
  return String(Math.round(number * 1e6) / 1e6)
}

/** @param {string} xml @param {string[]} strings */
function sheetRows(xml, strings) {
  /** @type {string[][]} */
  const rows = []
  for (const row of xml.matchAll(/<row\b([^>]*?)(?:\/>|>([\s\S]*?)<\/row>)/g)) {
    if (rows.length >= MAX_ROWS) break
    const number = Number(/\br="(\d+)"/.exec(row[1])?.[1] ?? rows.length + 1)
    /** @type {string[]} */
    const cells = []
    let next = 0
    for (const cell of (row[2] ?? '').matchAll(/<c\b([^>]*?)(?:\/>|>([\s\S]*?)<\/c>)/g)) {
      const ref = /\br="([A-Z]+\d+)"/.exec(cell[1])?.[1]
      const index = ref ? columnIndex(ref) : next
      next = index + 1
      const type = /\bt="(\w+)"/.exec(cell[1])?.[1] ?? 'n'
      const body = cell[2] ?? ''
      const value = /<v>([\s\S]*?)<\/v>/.exec(body)?.[1] ?? ''
      let text = ''
      if (type === 's') text = strings[Number(value)] ?? ''
      else if (type === 'inlineStr') text = xmlText(/<is>([\s\S]*?)<\/is>/.exec(body)?.[1] ?? '')
      else if (type === 'n') text = value === '' ? '' : cleanNumber(value)
      else text = decodeEntities(value)
      cells[index] = text.trim()
    }
    rows[number - 1] = Array.from(cells, (value) => value ?? '')
  }
  const result = Array.from(rows, (row) => row ?? [])
  fillVerticalMerges(result, xml)
  return result
}

/**
 * Объединённые по вертикали ячейки (группа «Ж/Б конструкции (RC)» на несколько строк): значение
 * верхней ячейки повторяется в строках ниже, чтобы у каждой строки была своя группа.
 * Объединения по горизонтали и числа не трогаем: цена на две колонки или на несколько строк —
 * одна цена, а не несколько.
 * @param {string[][]} rows
 * @param {string} xml
 */
function fillVerticalMerges(rows, xml) {
  for (const merge of xml.matchAll(/<mergeCell\b[^>]*\bref="([A-Z]+)(\d+):([A-Z]+)(\d+)"/g)) {
    const [, fromCol, fromRow, toCol, toRow] = merge
    if (fromCol !== toCol) continue
    const col = columnIndex(fromCol)
    const top = Number(fromRow) - 1
    const value = rows[top]?.[col] ?? ''
    // Числа не размножаем: цена пакета на несколько строк состава — одна цена.
    if (!value || /^-?\d+(\.\d+)?$/.test(value)) continue
    for (let r = top + 1; r < Number(toRow) && r < rows.length; r++) {
      const row = rows[r]
      while (row.length < col) row.push('')
      if (!row[col]) row[col] = value
    }
  }
}

/** @param {Uint8Array} bytes @returns {Promise<Sheet[]>} */
async function readXlsx(bytes) {
  const files = zipEntries(bytes)
  const read = async (/** @type {string} */ name) => (await files.get(name)?.()) ?? ''
  const workbook = await read('xl/workbook.xml')
  if (!workbook) throw new SpreadsheetError('В файле нет листов Excel. Это точно .xlsx?')
  const rels = await read('xl/_rels/workbook.xml.rels')
  const targets = new Map(
    [...rels.matchAll(/<Relationship\b([^>]*)\/?>/g)].map((rel) => [
      /\bId="([^"]+)"/.exec(rel[1])?.[1],
      /\bTarget="([^"]+)"/.exec(rel[1])?.[1] ?? '',
    ]),
  )
  const strings = sharedStrings(await read('xl/sharedStrings.xml'))
  /** @type {Sheet[]} */
  const sheets = []
  for (const sheet of workbook.matchAll(/<sheet\b([^>]*)\/?>/g)) {
    const name = decodeEntities(/\bname="([^"]*)"/.exec(sheet[1])?.[1] ?? 'Лист')
    const id = /\br:id="([^"]+)"/.exec(sheet[1])?.[1]
    const target = targets.get(id) ?? ''
    const path = target.startsWith('/') ? target.slice(1) : `xl/${target.replace(/^\.\//, '')}`
    sheets.push({ name, rows: sheetRows(await read(path), strings) })
  }
  return sheets
}

// ---------- csv и html ----------

/** @param {string} text */
function csvRows(text) {
  const source = text.replace(/^﻿/, '')
  const firstLine = source.slice(0, source.indexOf('\n') >>> 0)
  const delimiter = [';', '\t', ','].reduce((best, ch) =>
    firstLine.split(ch).length > firstLine.split(best).length ? ch : best,
  )
  /** @type {string[][]} */
  const rows = []
  let row = /** @type {string[]} */ ([])
  let cell = ''
  let quoted = false
  for (let i = 0; i < source.length; i++) {
    const ch = source[i]
    if (quoted) {
      if (ch === '"' && source[i + 1] === '"') {
        cell += '"'
        i++
      } else if (ch === '"') quoted = false
      else cell += ch
    } else if (ch === '"' && cell === '') quoted = true
    else if (ch === delimiter) {
      row.push(cell.trim())
      cell = ''
    } else if (ch === '\n' || ch === '\r') {
      if (ch === '\r' && source[i + 1] === '\n') i++
      row.push(cell.trim())
      rows.push(row)
      row = []
      cell = ''
    } else cell += ch
    if (rows.length >= MAX_ROWS) break
  }
  if (cell !== '' || row.length) rows.push([...row, cell.trim()])
  return rows
}

/** @param {string} text */
function htmlRows(text) {
  return [...text.matchAll(/<tr[^>]*>([\s\S]*?)<\/tr>/gi)].slice(0, MAX_ROWS).map((tr) =>
    [...tr[1].matchAll(/<t[dh][^>]*>([\s\S]*?)<\/t[dh]>/gi)].map((td) =>
      decodeEntities(td[1].replace(/<br\s*\/?>/gi, ' ').replace(/<[^>]+>/g, ''))
        .replace(/\s+/g, ' ')
        .trim(),
    ),
  )
}
