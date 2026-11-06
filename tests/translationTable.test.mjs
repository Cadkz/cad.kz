import assert from 'node:assert/strict'
import { test } from 'node:test'
import { readSpreadsheet } from '../src/domain/spreadsheet.mjs'
import {
  nextPart,
  planUpdates,
  progress,
  readTranslationRows,
  sameMarkup,
  tableGroups,
  writeTranslationXlsx,
} from '../src/domain/translationTable.mjs'

const product = {
  id: 7,
  title: { ru: 'AutoCAD', kk: 'AutoCAD', en: null },
  summary: { ru: 'Чертежи и проекты', kk: null, en: null },
  description: { ru: '<p>Программа для <strong>чертежей</strong></p>', kk: null, en: null },
  tasks: [
    { id: 'a1', title: { ru: 'Чертежи', kk: 'Сызбалар', en: null } },
    { id: 'a2', title: { ru: 'Проекты', kk: null, en: null } },
  ],
  faq: [{ id: 'f1', question: { ru: 'Есть пробная?', kk: null, en: null }, answer: { ru: 'Да' } }],
  seo: { title: { ru: 'AutoCAD купить', kk: null, en: null }, description: null },
}
const section = { id: 3, title: { ru: 'САПР', kk: 'ЖАЖ', en: 'CAD' }, summary: { ru: '' } }
const docs = { sections: [section], products: [product] }

test('строки таблицы: по документам, без пустого русского', () => {
  const groups = tableGroups(docs)
  assert.equal(groups.length, 2)
  assert.deepEqual(
    groups[1].map((row) => row.key),
    [
      'products:7:title',
      'products:7:summary',
      'products:7:description',
      'products:7:tasks:a1:title',
      'products:7:tasks:a2:title',
      'products:7:faq:f1:question',
      'products:7:faq:f1:answer',
      'products:7:seo.title',
    ],
  )
  assert.equal(groups[1][3].what, 'AutoCAD · Задача 1')
  assert.equal(groups[1][3].kk, 'Сызбалар')
  const state = progress(groups)
  assert.equal(state.texts, 9)
  assert.equal(state.missingDocs, 1)
})

test('следующая часть: только непереведённое, документ целиком', () => {
  const groups = tableGroups(docs)
  const part = nextPart(groups, 5)
  assert.ok(part.every((row) => row.key.startsWith('products:7')))
  assert.equal(part.length, 8)
})

test('xlsx записывается и читается обратно с HTML и переносами', async () => {
  const rows = tableGroups(docs).flat()
  rows[3].en = 'A program for\n<strong>drawings</strong> & more'
  const sheets = await readSpreadsheet(new Uint8Array(writeTranslationXlsx(rows)))
  const read = readTranslationRows(sheets)
  assert.ok(read)
  assert.equal(read.rows.length, rows.length)
  assert.equal(read.rows[3].en, 'A program for\n<strong>drawings</strong> & more')
  assert.equal(read.rows[0].kk, 'ЖАЖ')
})

test('разметка перевода сверяется по тегам', () => {
  assert.ok(sameMarkup('<p>Да <b>нет</b></p>', '<p>Yes <b>no</b></p>'))
  assert.ok(!sameMarkup('<p>Да <b>нет</b></p>', '<p>Yes no</p>'))
  const ru = '## Возможности\n\n- Чертежи\n- [Модели](/catalog)'
  assert.ok(sameMarkup(ru, '## Features\n\n- Drawings\n- [Models](/catalog)'))
  assert.ok(!sameMarkup(ru, '## Features\n\n- Drawings, [models](/catalog)'))
  assert.ok(!sameMarkup(ru, '## Features\n\n- Drawings\n- [Models](/en/catalog)'))
})

test('изменения: массив целиком, пустое не стирает, сломанная разметка пропускается', () => {
  const plan = planUpdates(
    [
      { key: 'products:7:tasks:a2:title', kk: 'Жобалар', en: 'Projects' },
      { key: 'products:7:title', kk: 'AutoCAD', en: '' },
      { key: 'products:7:description', kk: '<p>Сызбаларға арналған бағдарлама</p>', en: '' },
      { key: 'products:7:seo.title', kk: '', en: 'Buy AutoCAD' },
      { key: 'products:9:title', kk: 'X', en: '' },
    ],
    (collection, id) => (collection === 'products' && id === 7 ? product : undefined),
  )
  assert.equal(plan.unchanged, 1)
  assert.equal(plan.updates.length, 1)
  const [update] = plan.updates
  assert.deepEqual(update.data.kk.tasks, [
    { id: 'a1', title: 'Сызбалар' },
    { id: 'a2', title: 'Жобалар' },
  ])
  assert.deepEqual(update.data.en.tasks, [
    { id: 'a1', title: null },
    { id: 'a2', title: 'Projects' },
  ])
  assert.deepEqual(update.data.en.seo, { title: 'Buy AutoCAD', description: null })
  assert.equal(update.data.kk.description, undefined)
  assert.deepEqual(
    plan.problems.map((problem) => problem.reason),
    [
      'разметка не совпадает с русской (теги, строки или ссылки)',
      'товар или раздел не найден (удалён?)',
    ],
  )
})
