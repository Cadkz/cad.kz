import assert from 'node:assert/strict'
import test from 'node:test'
import { deflateRawSync } from 'node:zlib'
import {
  codeName,
  guessColumns,
  matchRows,
  oneCPriceKind,
  parsePrice,
  priceLabel,
  priceRows,
  priceSets,
  priceSheet,
  vendorFromFile,
} from '../src/domain/priceList.mjs'
import { readSpreadsheet, SpreadsheetError } from '../src/domain/spreadsheet.mjs'

/** Минимальный .xlsx: zip с книгой, одним листом и общими строками (часть файлов сжата). */
function xlsx(sheetXml, strings) {
  return zip({
    'xl/workbook.xml':
      '<workbook><sheets><sheet name="Прайс SCAD" sheetId="1" r:id="rId1"/></sheets></workbook>',
    'xl/_rels/workbook.xml.rels':
      '<Relationships><Relationship Id="rId1" Target="worksheets/sheet1.xml"/></Relationships>',
    'xl/sharedStrings.xml': `<sst>${strings.map((s) => `<si><t>${s}</t></si>`).join('')}</sst>`,
    'xl/worksheets/sheet1.xml': sheetXml,
  })
}

/** Zip из файлов: чётные сжаты, нечётные хранятся как есть (как в настоящих архивах). */
function zip(files) {
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
  assert.deepEqual(guessColumns(rows), {
    headerRow: 1,
    nameCol: 1,
    priceCol: 3,
    idCol: -1,
    groupCol: -1,
    codeCol: -1,
    prices: [],
  })
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

test('прайс SCAD: группа слева, две цены в строке (S392 и S Pro), евро правее', () => {
  const rows = [
    ['CAD.kz — прайс'],
    ['Пакет', 'SCAD++', 'Цена в тг. с НДС', '', '', ''],
    ['', '', 'S392', 'S Рго', '', ''],
    ['Ж/Б конструкции (RC)', 'Проверка и подбор арматуры', '382800', '382800', '600', '600'],
    [
      'Напряженно-деформированное состояние (SSВ)',
      'Линейный процессор',
      '2762540',
      '3604700',
      '4330',
      '5650',
    ],
    ['Напряженно-деформированное состояние (SSВ)', 'Комбинации загружений', '', '', '', ''],
    ['', '', '3145340', '3987500', '4930', '6250'],
    ['Сателлиты', 'КРИСТАЛЛ - экспертиза', '574200', '', '900', ''],
    ['Сателлиты', 'АРБАТ - подбор арматуры', '574200', '', '900', ''],
  ]
  const columns = guessColumns(rows)
  assert.equal(columns.headerRow, 1)
  assert.equal(columns.nameCol, 1)
  assert.equal(columns.groupCol, 0)
  const sets = priceSets(rows, columns)
  assert.deepEqual(
    sets.map((set) => [set.prices.map((p) => p.col), set.kzt]),
    [
      [[2, 3], true],
      [[4, 5], false],
    ],
  )
  const found = priceRows(rows, { ...columns, prices: sets[1].prices })
  assert.deepEqual(
    found.map((row) => [row.name, row.price]),
    [
      ['Ж/Б конструкции (RC) — Проверка и подбор арматуры · S392', '600'],
      ['Ж/Б конструкции (RC) — Проверка и подбор арматуры · SPro', '600'],
      ['Напряженно-деформированное состояние (SSВ) — Линейный процессор · S392', '4330'],
      ['Напряженно-деформированное состояние (SSВ) — Линейный процессор · SPro', '5650'],
      ['Сателлиты — КРИСТАЛЛ - экспертиза', '900'],
      ['Сателлиты — АРБАТ - подбор арматуры', '900'],
    ],
  )
  assert.deepEqual(found[0].alt, ['Ж/Б конструкции (RC) S392', 'Проверка и подбор арматуры S392'])
  const offers = [
    {
      id: 1,
      label: 'SCAD комплект RC (Ж/Б конструкции) · SCAD++ Ж/Б конструкции (RC) S392',
      names: [],
    },
    {
      id: 2,
      label: 'SCAD комплект RC (Ж/Б конструкции) · SCAD++ Ж/Б конструкции (RC) SPRO',
      names: [],
    },
    { id: 3, label: 'КРИСТАЛЛ - экспертиза и расчет элементов стальных конструкций', names: [] },
  ]
  const matched = matchRows(found, offers)
  assert.deepEqual(
    matched.slice(0, 2).map((m) => [m.offerId, m.status]),
    [
      [1, 'auto'],
      [2, 'auto'],
    ],
  )
  assert.deepEqual([matched[4].offerId, matched[4].status], [3, 'auto'])
})

test('подпись колонки: похожая кириллица → латиница', () => {
  assert.equal(priceLabel('S Рго'), 'SPro')
  assert.equal(priceLabel('S Ргоmax'), 'SPromax')
  assert.equal(priceLabel('S392'), 'S392')
  assert.equal(priceLabel('Цена'), 'Цена')
})

test('xlsx: объединённая по вертикали группа повторяется в строках, цена — нет', async () => {
  const sheet = `<worksheet><sheetData>
    <row r="1"><c r="A1" t="inlineStr"><is><t>Сателлиты</t></is></c><c r="B1" t="inlineStr"><is><t>КРИСТАЛЛ</t></is></c><c r="C1"><v>900</v></c></row>
    <row r="2"><c r="B2" t="inlineStr"><is><t>АРБАТ</t></is></c></row>
  </sheetData><mergeCells count="2"><mergeCell ref="A1:A2"/><mergeCell ref="C1:C2"/></mergeCells></worksheet>`
  const [first] = await readSpreadsheet(xlsx(sheet, []))
  assert.deepEqual(first.rows, [
    ['Сателлиты', 'КРИСТАЛЛ', '900'],
    ['Сателлиты', 'АРБАТ'],
  ])
})

/** Выгрузка прайса из 1С в .ods: служебный лист «Вид цены» и лист с товарами. */
function ods() {
  const cell = (v) =>
    typeof v === 'number'
      ? `<table:table-cell office:value-type="float" office:value="${v}"><text:p>${String(v).replace('.', ',')}</text:p></table:table-cell>`
      : `<table:table-cell office:value-type="string"><text:p>${v}</text:p></table:table-cell>`
  const row = (cells) =>
    `<table:table-row>${cells.map(cell).join('')}<table:table-cell table:number-columns-repeated="1020"/></table:table-row>`
  const content =
    '<office:document-content><office:body><office:spreadsheet>' +
    `<table:table table:name="Лист1">${row(['Уникальный идентификатор', 'Вид цены', 'Номер колонки "Цена"'])}${row(['261f', 'Рекомендованная с НДС', 8])}</table:table>` +
    `<table:table table:name="Лист_1">${row(['№', 'Артикул', 'Товар', 'Цена'])}<table:table-row table:number-rows-repeated="1"><table:table-cell table:number-columns-repeated="4"/></table:table-row>` +
    row([
      1,
      'GCS27L-CT-10000000',
      'Право на использование программного обеспечения ПК GeoniCS (2027.x, локальная лицензия (1 год))',
      1145337.6,
    ]) +
    row([2, 'GCS27L-CT-20000000', 'GeoniCS (2027.x, локальная лицензия (2 года))', 2230958.4]) +
    row([3, 'GCS27E-CT-10000000', 'GeoniCS учебная', 'по запросу']) +
    row([4, 'GCS27A-CT-10000000', 'GeoniCS доп. место', 900]) +
    '<table:table-row table:number-rows-repeated="1048000"><table:table-cell table:number-columns-repeated="1024"/></table:table-row>' +
    '</table:table></office:spreadsheet></office:body></office:document-content>'
  return zip({ mimetype: 'application/vnd.oasis.opendocument.spreadsheet', 'content.xml': content })
}

test('ods из 1С: служебный лист пропускается, точные числа, артикул, НДС по виду цены', async () => {
  const sheets = await readSpreadsheet(ods())
  assert.deepEqual(
    sheets.map((s) => s.name),
    ['Лист1', 'Лист_1'],
  )
  assert.equal(sheets[1].rows.length, 6, 'хвост пустых строк отброшен')
  assert.equal(priceSheet(sheets), 1)
  assert.deepEqual(oneCPriceKind(sheets), { includesVat: true, kind: 'Рекомендованная с НДС' })
  const columns = guessColumns(sheets[1].rows)
  assert.equal(columns.codeCol, 1)
  const rows = priceRows(sheets[1].rows, columns)
  assert.equal(rows[0].price, '1145337.6')
  assert.equal(rows[0].code, 'GCS27L-CT-10000000')
  assert.equal(rows[2].price, null)
})

test('по запомненному артикулу строка находится, даже если название сменилось', () => {
  const offers = [
    { id: 7, label: 'Совсем другое название', names: [codeName('GCS27L-CT-10000000')] },
    { id: 8, label: 'GeoniCS локальная 1 год', names: [] },
  ]
  const [result] = matchRows(
    [{ index: 1, name: 'GeoniCS 2028.x новая', id: '', price: '1', code: 'GCS27L-CT-10000000' }],
    offers,
  )
  assert.equal(result.offerId, 7)
  assert.equal(result.status, 'saved')
})

test('производитель по имени файла из папки «Прайсы»', () => {
  const vendors = [
    'Autodesk',
    'SCAD Soft',
    'Fine Software',
    'CSoft Development',
    'НТП Трубопровод',
  ].map((title, id) => ({ id, title }))
  assert.equal(vendorFromFile('Прайс_SCAD_2026-09-15.xlsx', vendors), 1)
  assert.equal(vendorFromFile('Прайс_FinSoft_GEO5_2026-09-15.ods', vendors), 2)
  assert.equal(vendorFromFile('Прайс_НТП_Трубопровод_2026-09-24.ods', vendors), 4)
  assert.equal(vendorFromFile('Прайс_2026-09-24.xlsx', vendors), null)
  assert.equal(vendorFromFile('price.xlsx', vendors), null)
})

test('редакция «S 392» = «S392», та же цена помогает найти, цена в разы другая — не предлагается', () => {
  const offers = [
    {
      id: 1,
      label: 'SCAD++ Напряженно-деформированное состояние (SSB) S392',
      names: [],
      kzt: '2762540',
    },
    {
      id: 2,
      label: 'SCAD++ Напряженно-деформированное состояние (SSB) SPro',
      names: [],
      kzt: '3604700',
    },
    { id: 5, label: 'SCAD Office v. 25.1 · Полная конфигурация, S392', names: [], kzt: '7273200' },
    {
      id: 9,
      label: 'SCAD Office v. 25.1 · Полная конфигурация, S Promax',
      names: [],
      kzt: '7783600',
    },
  ]
  const row = (index, name, kzt) => ({ index, name, id: '', price: kzt, kzt })
  const res = matchRows(
    [
      row(
        1,
        'Право на использование SCAD Office Напряженно-деформированное состояние (SSВ) S 392',
        '2762540',
      ),
      row(
        2,
        'Право на использование SCAD Office Напряженно-деформированное состояние (SSВ) S PRO',
        '3604700',
      ),
      row(
        3,
        'При приобретении полной конфигурации SCAD Office, включает справочники S392',
        '7273200',
      ),
      row(4, 'Дополнительные функции SCAD Office полная конфигурация', '612480'),
    ],
    offers,
  )
  assert.deepEqual(
    res.map((r) => r.offerId),
    [1, 2, 5, null],
  )
})
