import assert from 'node:assert/strict'
import { test } from 'node:test'
import { autoPart, autoRequest, autoRows, translateRows } from '../src/domain/autoTranslate.mjs'

const row = (key, ru, kk = '', en = '') => ({ key, what: 'Описание', ru, kk, en })

const groups = [
  [row('sections:1:title', 'Раздел', 'Бөлім', 'Section')],
  [row('products:1:title', 'AutoCAD'), row('products:1:description', 'а'.repeat(3000))],
  [row('products:2:title', 'Revit', 'Revit', '')],
  [row('products:3:title', 'Civil 3D')],
  [row('products:4:description', 'б'.repeat(9000))],
]

test('часть: только непереведённое, по дорожкам, пропуски не берутся', () => {
  assert.deepEqual(
    autoPart(groups).map((item) => item.key),
    ['products:1:title', 'products:1:description', 'products:2:title', 'products:3:title'],
  )
  assert.deepEqual(
    autoPart(groups, { lane: 1, lanes: 2 }).map((item) => item.key),
    ['products:1:title', 'products:1:description', 'products:3:title'],
  )
  assert.deepEqual(
    autoPart(groups, { lane: 0, lanes: 2, skip: new Set(['products:2:title']) }).map(
      (item) => item.key,
    ),
    ['products:4:description'],
  )
  assert.deepEqual(
    autoPart(groups, { maxDocs: 1 }).map((item) => item.key),
    ['products:1:title', 'products:1:description'],
  )
  assert.equal(autoPart([[row('products:4:description', 'б'.repeat(9000))]]).length, 1)
  assert.equal(autoPart([groups[0]]).length, 0)
})

test('запрос: инструмент обязателен, в модель уходят только ключ, подпись и русский', () => {
  const body = autoRequest('claude-sonnet-5-5', [row('products:2:title', 'Revit', 'Revit')])
  assert.deepEqual(body.tool_choice, { type: 'tool', name: 'save_translations' })
  assert.deepEqual(JSON.parse(body.messages[0].content), [
    { key: 'products:2:title', what: 'Описание', ru: 'Revit' },
  ])
})

test('ответ: чужие ключи отброшены, готовый перевод не перезаписывается, пропуски видны', () => {
  const sent = [
    row('products:2:title', 'Задача', 'Тапсырма', ''),
    row('products:3:title', 'Вопрос'),
    row('products:5:title', 'Ответ'),
  ]
  const data = {
    content: [
      {
        type: 'tool_use',
        name: 'save_translations',
        input: {
          rows: [
            { key: 'products:2:title', kk: 'Другое', en: ' Task ' },
            { key: 'products:3:title', kk: 'Сұрақ', en: '' },
            { key: 'products:9:title', kk: 'x', en: 'y' },
          ],
        },
      },
    ],
  }
  assert.deepEqual(autoRows(data, sent), {
    rows: [
      { key: 'products:2:title', kk: '', en: 'Task' },
      { key: 'products:3:title', kk: 'Сұрақ', en: '' },
    ],
    missing: ['products:3:title', 'products:5:title'],
  })
  assert.deepEqual(autoRows({}, sent).missing.length, 3)
})

test('ошибка модели передаёт код ответа', async () => {
  const fetchImpl = async () => new Response('{}', { status: 529 })
  await assert.rejects(
    translateRows({ fetchImpl, apiKey: 'k', model: 'm', rows: [row('products:1:title', 'А')] }),
    (failure) => failure.status === 529,
  )
})
