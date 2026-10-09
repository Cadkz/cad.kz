import assert from 'node:assert/strict'
import test from 'node:test'
import { deflateRawSync } from 'node:zlib'
import { guessColumns, matchRows, parsePrice, priceRows } from '../src/domain/priceList.mjs'
import { readSpreadsheet, SpreadsheetError } from '../src/domain/spreadsheet.mjs'

/** Минимальный .xlsx: zip с книгой, одним листом и общими строками (часть файлов сжата). */
function xlsx(sheetXml, strings) {
  const files = {
    'xl/workbook.xml':
      '<workbook><sheets><sheet name="Прайс SCAD" sheetId="1" r:id="rId1"/></sheets></workbook>',
    'xl/_rels/workbook.xml.rels':
      '<Relationships><Relationship Id="rId1" Target="worksheets/sheet1.xml"/></Relationships>',
    'xl/sharedStrings.xml': `<sst>${strings.map((s) => `<si><t>${s}</t></si>`).join('')}</sst>`,
    'xl/worksheets/sheet1.xml': sheetXml,
  }
  const local = []
  const central = []
  let offset = 0
  for (const [index, [name, text]] of Object.entries(files).entries()) {
    const raw = Buffer.from(text)
    const deflate = index % 2 === 0
    const data = deflate ? deflateRawSync(raw) : raw
    const nameBytes = Buffer.from(name)
    const head = Buffer.alloc(30)
    head.writeUInt32LE(0x04034b50, 0)
    head.writeUInt16LE(deflate ? 8 : 0, 8)
    head.writeUInt32LE(data.length, 18)
    head.writeUInt32LE(raw.length, 22)
    head.writeUInt16LE(nameBytes.length, 26)
    local.push(head, nameBytes, data)
    const dir = Buffer.alloc(46)
    dir.writeUInt32LE(0x02014b50, 0)
    dir.writeUInt16LE(deflate ? 8 : 0, 10)
    dir.writeUInt32LE(data.length, 20)
    dir.writeUInt32LE(raw.length, 24)
    dir.writeUInt16LE(nameBytes.length, 28)
    dir.writeUInt32LE(offset, 42)
    central.push(dir, nameBytes)
    offset += 30 + nameBytes.length + data.length
  }
  const dirBytes = Buffer.concat(central)
  const end = Buffer.alloc(22)
  end.writeUInt32LE(0x06054b50, 0)
  end.writeUInt16LE(Object.keys(files).length, 10)
  end.writeUInt32LE(dirBytes.length, 12)
  end.writeUInt32LE(offset, 16)
  return new Uint8Array(Buffer.concat([...local, dirBytes, end]))
}

test('xlsx: общие строки, числа без хвостов, пропуски колонок и строк', async () => {
  const sheet = `<worksheet><sheetData>
    <row r="1"><c r="A1" t="s"><v>0</v></c></row>
    <row r="3"><c r="A3" t="s"><v>1</v></c><c r="C3" t="s"><v>2</v></c></row>
    <row r="4"><c r="A4" t="inlineStr"><is><t>SCAD++ Ж/Б &amp; сталь</t></is></c><c r="C4"><v>4329.9999999999</v></c></row>
  </sheetData></worksheet>`
  const [first] = await readSpreadsheet(xlsx(sheet, ['Прайс 2026', 'Наименование', 'Цена, EUR']))
  assert.equal(first.name, 'Прайс SCAD')
  assert.deepEqual(first.rows, [
    ['Прайс 2026'],
    [],
    ['Наименование', '', 'Цена, EUR'],
    ['SCAD++ Ж/Б & сталь', '', '4330'],
  ])
})

test('csv с точкой с запятой и старый .xls', async () => {
  const csv = new TextEncoder().encode('﻿ID;Наименование;Цена\r\n12;"Товар; с точкой";1 200,50\r\n')
  const [sheet] = await readSpreadsheet(csv)
  assert.deepEqual(sheet.rows[1], ['12', 'Товар; с точкой', '1 200,50'])
  await assert.rejects(readSpreadsheet(new Uint8Array([0xd0, 0xcf, 0x11, 0xe0])), SpreadsheetError)
})

test('цена из ячейки', () => {
  assert.equal(parsePrice('1 234 567,89 ₸'), '1234567.89')
  assert.equal(parsePrice('12.500'), '12500')
  assert.equal(parsePrice('1,234.50'), '1234.5')
  assert.equal(parsePrice('€ 600'), '600')
  assert.equal(parsePrice('7 100 руб.'), '7100')
  assert.equal(parsePrice('0'), null)
  assert.equal(parsePrice('по запросу'), null)
})

test('колонки по заголовкам; из двух цен — та, где больше чисел', () => {
  const rows = [
    ['Прайс'],
    ['№', 'Наименование', 'Цена старая', 'Цена'],
    ['1', 'А', '', '100'],
    ['2', 'Б', '', '200'],
  ]
  assert.deepEqual(guessColumns(rows), { headerRow: 1, nameCol: 1, priceCol: 3, idCol: -1 })
})

const offers = [
  { id: 1, label: 'SCAD комплект SS · SCAD++ Стальные конструкции (SS) SPRO', names: [] },
  { id: 2, label: 'SCAD комплект SS · SCAD++ Стальные конструкции (SS) S392', names: [] },
  {
    id: 3,
    label: 'SCAD комплект SSB · SCAD++ Напряженно-деформированное состояние (SSВ) S392',
    names: [],
  },
  { id: 4, label: 'SCAD Office v. 25.1 · С доп. функциями', names: [] },
  { id: 5, label: 'SCAD Office v. 25.1 · Без доп. функций', names: [] },
  {
    id: 6,
    label: 'КРИСТАЛЛ - экспертиза и расчет элементов стальных конструкций',
    names: ['Кристалл 2026'],
  },
]
const row = (index, name, price = '100', id = '') => ({ index, name, price, id })

test('совпадения: код комплекта, русская В вместо латинской, короткое название', () => {
  const result = matchRows(
    [
      row(1, 'SCAD++ Стальные конструкции (SS) S392'),
      row(2, 'SCAD++ Напряженно-деформированное состояние (SSB) S392'),
      row(3, 'SCAD Office 25.1 без дополнительных функций'),
      row(4, 'Монолит'),
      row(5, 'Раздел', null),
    ],
    offers,
  )
  assert.deepEqual(
    result.map((r) => [r.offerId, r.status]),
    [
      [2, 'auto'],
      [3, 'auto'],
      [5, 'auto'],
      [null, 'none'],
      [null, 'noPrice'],
    ],
  )
})

test('ID и запомненное название важнее похожести; одно предложение — одной строке', () => {
  const result = matchRows(
    [row(1, 'что угодно', '10', '4'), row(2, 'кристалл 2026'), row(3, 'Кристалл')],
    offers,
  )
  assert.deepEqual(
    result.map((r) => [r.offerId, r.status]),
    [
      [4, 'id'],
      [6, 'saved'],
      [null, 'none'],
    ],
  )
})

test('строки прайса: без заголовка, без пустых и без чисел вместо названия', () => {
  const rows = [
    ['Наименование', 'Цена'],
    ['А', '1 000'],
    ['', '5'],
    ['123', '4'],
    ['Б', 'нет'],
  ]
  assert.deepEqual(priceRows(rows, { headerRow: 0, nameCol: 0, priceCol: 1, idCol: -1 }), [
    { index: 1, name: 'А', id: '', price: '1000' },
    { index: 4, name: 'Б', id: '', price: null },
  ])
})
