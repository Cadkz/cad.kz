import assert from 'node:assert/strict'
import { test } from 'node:test'
import { htmlToMarkup, parsePublicationPage } from '../src/domain/legacyPages.mjs'
import {
  gridRows,
  headSpans,
  outerTables,
  parseTable,
  tableMarkup,
  withTables,
} from '../src/domain/tables.mjs'

const SPECS =
  '<table><tbody><tr><td><p>CUDA Cores</p></td><td><p>384</p></td></tr>' +
  '<tr><td><p>GPU Memory</p></td><td>2 GB | GDDR5</td></tr></tbody></table>'
const WIDE =
  '<table><tr><th>ПО</th><th>CPU</th><th>DDR</th></tr>' +
  '<tr><td>NanoCAD</td><td colspan="2">4Gb</td></tr><tr><td>Revit</td><td>i7</td><td>8Gb</td></tr></table>'

test('таблица данных переносится разметкой, ячейки по колонкам, шапка из <th>', () => {
  const { body, tables } = htmlToMarkup(
    `<p>Вступление.</p>${SPECS}<p>После.</p>${WIDE}`,
    undefined,
    {
      tables: true,
    },
  )
  assert.equal(
    body,
    'Вступление.\n\n| CUDA Cores | 384 |\n| GPU Memory | 2 GB / GDDR5 |\n\nПосле.\n\n' +
      '| ПО | CPU | DDR |\n| --- | --- | --- |\n| NanoCAD | 4Gb |  |\n| Revit | i7 | 8Gb |',
  )
  assert.equal(tables.length, 2)
  assert.equal(tables[0]?.flat, 'CUDA Cores\n\n384\n\nGPU Memory\n\n2 GB | GDDR5')
})

test('раскладка старого сайта (длинный текст, одна колонка, таблица в таблице) — текстом', () => {
  const long = `<table><tr><td>${'Текст. '.repeat(40)}</td><td>a</td></tr><tr><td>b</td><td>c</td></tr></table>`
  assert.equal(htmlToMarkup(long, undefined, { tables: true }).tables.length, 0)
  assert.equal(
    htmlToMarkup('<table><tr><td>Один</td></tr><tr><td>Два</td></tr></table>', undefined, {
      tables: true,
    }).tables.length,
    0,
  )
  assert.equal(outerTables(`<table><tr><td>${SPECS}</td></tr></table>`).length, 0)
})

test('без tables перенос как раньше: по ячейке в строку', () => {
  assert.equal(htmlToMarkup(SPECS).body, 'CUDA Cores\n\n384\n\nGPU Memory\n\n2 GB | GDDR5')
})

test('восстановление: столбик заменяется таблицей, правленный текст не трогается', () => {
  const { body, tables } = htmlToMarkup(`<p>Вступление.</p>${SPECS}`, undefined, { tables: true })
  const old = htmlToMarkup(`<p>Вступление.</p>${SPECS}`).body
  assert.deepEqual(withTables(old, tables), { body, replaced: 1, missed: 0 })
  assert.deepEqual(withTables(body, tables), { body, replaced: 0, missed: 0 })
  const edited = old.replace('384', '512')
  assert.deepEqual(withTables(edited, tables), { body: edited, replaced: 0, missed: 1 })
})

const PICTURED =
  '<table><tr><td>Карта</td><td><img src="/upload/a.png" alt="A"></td><td>' +
  '<a href="/upload/spec.pdf">Паспорт</a></td></tr>' +
  '<tr><td>Сайт</td><td><a href="/bitrix/redirect.php?goto=https%3A%2F%2Fnvidia.com">NVIDIA</a></td>' +
  '<td>8 GB</td></tr></table>'

test('восстановление после шага «Картинки в текстах»: адреса из «Медиа», картинки под таблицей', () => {
  const html = `<p>Вступление.</p>${PICTURED}<p>После.</p>`
  const { tables } = htmlToMarkup(html, undefined, { tables: true })
  // Так текст выглядит в базе: картинка и PDF скачаны в «Медиа», переход redirect.php убран.
  const stored = htmlToMarkup(html)
    .body.replace('https://cad.kz/upload/a.png', '/api/media/file/a.png')
    .replace('/upload/spec.pdf', '/api/media/file/spec.pdf')
    .replace(/\/bitrix\/redirect\.php\?[^)]*/, 'https://nvidia.com')
  const { body, replaced, missed } = withTables(stored, tables)
  assert.equal(replaced, 1)
  assert.equal(missed, 0)
  assert.equal(
    body,
    'Вступление.\n\n| Карта |  | [Паспорт](/api/media/file/spec.pdf) |\n' +
      '| Сайт | [NVIDIA](https://nvidia.com) | 8 GB |\n\n![A](/api/media/file/a.png)\n\nПосле.',
  )
  assert.deepEqual(withTables(body, tables), { body, replaced: 0, missed: 0 })
})

test('картинки, которой нет на старом сайте, нет и в тексте — таблица всё равно встаёт', () => {
  const html = `<p>Вступление.</p>${PICTURED}`
  const { tables } = htmlToMarkup(html, undefined, { tables: true })
  const stored = htmlToMarkup(html)
    .body.replace(/!\[A\]\([^)]*\)\n\n/, '')
    .replace('[Паспорт](/upload/spec.pdf)', 'Паспорт')
  const { body, replaced } = withTables(stored, tables)
  assert.equal(replaced, 1)
  assert.ok(body.includes('| Карта |  | Паспорт |'))
  assert.ok(!body.includes('!['))
})

test('разбор разметки таблицы: шапка, пары без шапки, не таблица', () => {
  assert.deepEqual(
    parseTable(['| ПО | CPU | DDR |', '| --- | --- | --- |', '| NanoCAD | 4Gb |  |']),
    {
      head: [['ПО', 'CPU', 'DDR']],
      rows: [['NanoCAD', '4Gb', '']],
    },
  )
  assert.deepEqual(parseTable(['| CUDA Cores | 384 |', '| GPU | 2 GB |']), {
    head: null,
    rows: [
      ['CUDA Cores', '384'],
      ['GPU', '2 GB'],
    ],
  })
  assert.equal(parseTable(['| одна строка |']), null)
  assert.equal(parseTable(['Обычный текст', '| x |']), null)
})

test('пустые строки и колонки убираются', () => {
  assert.equal(
    tableMarkup([
      { header: false, cells: ['a', '', 'b'] },
      { header: false, cells: ['', '', ''] },
      { header: false, cells: ['c', '', 'd'] },
    ]),
    '| a | b |\n| c | d |',
  )
})

test('текст публикации: таблица из двух колонок — пары, широкая — таблица', async () => {
  const { parseBody } = await import('../src/lib/richText.ts')
  const blocks = parseBody(
    '| CUDA Cores | 384 |\n| GPU | 2 GB |\n\n| ПО | CPU | DDR |\n| --- | --- | --- |\n| NanoCAD | 4Gb | 2Gb |',
  )
  assert.deepEqual(
    blocks.map((b) => b.type),
    ['fields', 'table'],
  )
})

test('страница старого сайта: публикация несёт таблицы для восстановления', () => {
  const html = `<html><head><title>Тест</title></head><body><h1>Тест</h1>
    <div class="bx-newsdetail-content"><p>Вступление статьи.</p>${WIDE}</div></body></html>`
  const parsed = parsePublicationPage(html, '/articles/test/')
  assert.equal(parsed?.tables.length, 1)
  assert.ok(parsed?.body.includes('| ПО | CPU | DDR |'))
  assert.equal(parsed?.excerpt, 'Вступление статьи.')
})

test('объединённые по вертикали ячейки не сдвигают строки ниже влево', () => {
  const cell = (value, rows = 1, span = 1) => ({ value, rows, span })
  assert.deepEqual(
    gridRows(
      [
        { header: true, cells: [cell('Класс'), cell('Модель'), cell('Память')] },
        { header: false, cells: [cell('Офис', 2), cell('T400'), cell('2 GB')] },
        { header: false, cells: [cell('T600'), cell('4 GB')] },
        { header: false, cells: [cell('Итого', 1, 2), cell('6 GB')] },
      ],
      '',
    ).map((row) => row.cells),
    [
      ['Класс', 'Модель', 'Память'],
      ['Офис', 'T400', '2 GB'],
      ['', 'T600', '4 GB'],
      ['Итого', '', '6 GB'],
    ],
  )
  const { body } = htmlToMarkup(
    '<table><tr><th>Класс</th><th>Модель</th><th>Память</th></tr>' +
      '<tr><td rowspan="2">Офис</td><td>T400</td><td>2 GB</td></tr><tr><td>T600</td><td>4 GB</td></tr></table>',
    undefined,
    { tables: true },
  )
  assert.equal(
    body,
    '| Класс | Модель | Память |\n| --- | --- | --- |\n| Офис | T400 | 2 GB |\n|  | T600 | 4 GB |',
  )
})

test('шапка без «| --- |»: строки сверху с пустым углом, подпись группы тянется вправо', () => {
  const table = parseTable([
    '|  |  | Время, сек. |  |',
    '|  | Комплектация | Запуск ОС | Завершение ОС |',
    '| 1 | 7/32/2000 | 15 | 20 |',
  ])
  assert.deepEqual(table?.head, [
    ['', '', 'Время, сек.', ''],
    ['', 'Комплектация', 'Запуск ОС', 'Завершение ОС'],
  ])
  assert.deepEqual(table?.rows, [['1', '7/32/2000', '15', '20']])
  assert.deepEqual(headSpans(table?.head?.[0] ?? []), [
    { text: '', span: 2 },
    { text: 'Время, сек.', span: 2 },
  ])
  // Две колонки с пустым углом — таблица с шапкой, а не пары «подпись — значение».
  assert.deepEqual(parseTable(['|  | Комплектации |', '| 1-4 | 7/32/2000 |'])?.head, [
    ['', 'Комплектации'],
  ])
})

test('длинный текст в ячейках с короткой шапкой — таблица; подписи к рисункам — текстом', () => {
  const text = 'Солидное оснащение даёт иллюзию уверенности. '.repeat(6)
  const headed =
    '<table><tr><td>РЕШЕНИЕ</td><td>ПОСЛЕДСТВИЯ</td></tr>' +
    `<tr><td>Постоянные лицензии</td><td>${text}</td></tr>` +
    `<tr><td>Временные лицензии</td><td>${text}</td></tr></table>`
  const { tables } = htmlToMarkup(headed, undefined, { tables: true })
  assert.equal(tables.length, 1)
  assert.ok(tables[0]?.markup.startsWith('| РЕШЕНИЕ | ПОСЛЕДСТВИЯ |\n| --- | --- |\n'))
  const figures =
    '<table><tr><td>а</td><td>б</td></tr>' +
    `<tr><td>Рис. 3. ${text}</td><td></td></tr><tr><td>x</td><td>y</td></tr></table>`
  assert.equal(htmlToMarkup(figures, undefined, { tables: true }).tables.length, 0)
})

test('восстановление: ячейки в тексте разбиты на абзацы иначе, чем сейчас', () => {
  const html =
    '<p>Список.</p><table><tr><td>Коллекции</td><td><a href="/c/aec/">Коллекция</a>' +
    '<sup><a href="/c/aec/">®</a></sup></td><td>30&nbsp;%</td></tr>' +
    '<tr><td>LT</td><td><a href="/c/lt/">AutoCAD LT</a></td><td>20 %</td></tr></table><p>После.</p>'
  const { body, tables } = htmlToMarkup(html, undefined, { tables: true })
  // Первый перенос: каждая ячейка — отдельным абзацем.
  const stored =
    'Список.\n\nКоллекции\n\n[Коллекция](/c/aec/)[®](/c/aec/)\n\n30 %\n\nLT\n\n' +
    '[AutoCAD LT](/c/lt/)\n\n20 %\n\nПосле.'
  const result = withTables(stored, tables)
  assert.equal(result.replaced, 1)
  assert.equal(result.body, body)
  // Начало слова не считается совпадением: «Коллекции» ≠ «Коллекц».
  assert.equal(withTables(stored.replace('Коллекции', 'Коллекц'), tables).replaced, 0)
})
