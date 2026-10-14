import assert from 'node:assert/strict'
import { test } from 'node:test'
import { htmlToMarkup, parsePublicationPage } from '../src/domain/legacyPages.mjs'
import { outerTables, parseTable, tableMarkup, withTables } from '../src/domain/tables.mjs'

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
  assert.deepEqual(withTables(old, tables), { body, replaced: 1 })
  assert.deepEqual(withTables(body, tables), { body, replaced: 0 })
  const edited = old.replace('384', '512')
  assert.deepEqual(withTables(edited, tables), { body: edited, replaced: 0 })
})

test('разбор разметки таблицы: шапка, пары без шапки, не таблица', () => {
  assert.deepEqual(
    parseTable(['| ПО | CPU | DDR |', '| --- | --- | --- |', '| NanoCAD | 4Gb |  |']),
    {
      head: ['ПО', 'CPU', 'DDR'],
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
