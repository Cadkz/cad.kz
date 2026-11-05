import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import test from 'node:test'
import { knowledgeForAnswer, pickFacts } from '../src/domain/assistant.mjs'
import { KADDI_FAQ, KADDI_FAQ_2 } from '../src/domain/kaddiFaq.mjs'

const imported = JSON.parse(
  readFileSync(new URL('../src/domain/kaddiFaqChatgpt.json', import.meta.url), 'utf8'),
)
const company = [
  ...new Map([...KADDI_FAQ, ...KADDI_FAQ_2].map((fact) => [fact.key, fact])).values(),
].map((fact) => ({ product: fact.key, text: fact.text }))
const facts = [...imported, ...company]
const user = (content) => ({ role: 'user', content })
const assistant = (content) => ({ role: 'assistant', content })

test('ремонт и аренда выбирают условия услуги, а не характеристики моделей', () => {
  const repair = pickFacts(facts, 'У вас есть ремонт плоттера?')
  assert.equal(repair.length, 1)
  assert.equal(repair[0].product, 'Справка: ремонт плоттеров')
  const rental = pickFacts(facts, 'Можно арендовать плоттер?')
  assert.ok(rental.some((fact) => fact.product === 'Справка: аренда плоттеров'))
  assert.ok(rental.every((fact) => /аренд/i.test(fact.text)))
})

test('сканер чертежей А0 находит WideTEK, без плоттеров и Artec', () => {
  for (const query of [
    'Нужен сканер для чертежей А0',
    'Нужен широкоформатный сканер',
    'Сканер документов A0',
  ]) {
    const result = pickFacts(facts, query)
    assert.ok(result.length > 0, query)
    assert.ok(
      result.some((fact) => /WideTEK 36/.test(fact.text)),
      query,
    )
    assert.ok(
      result.every((fact) => /WideTEK/.test(fact.product)),
      query,
    )
  }
})

test('GEO5 без интернета не подмешивает офлайн Autodesk или описание модулей', () => {
  const result = pickFacts(facts, 'Можно пользоваться GEO5 без интернета?')
  assert.equal(result.length, 1)
  assert.equal(result[0].product, 'Справка: GEO5 без интернета')
})

test('LT сохраняется как значимое слово, нужная справка идёт первой', () => {
  const result = pickFacts(facts, 'Чем отличается AutoCAD LT от AutoCAD?')
  assert.ok(result.slice(0, 3).some((fact) => /AutoLISP/.test(fact.text)))
  assert.ok(result.slice(0, 3).some((fact) => /двухмерного/.test(fact.text)))
})

test('короткое продолжение сохраняет предмет, смена темы не тащит старый товар и страницу', () => {
  const previous = [user('Нужен GEO5'), assistant('Для расчётов есть GEO5.')]
  const followup = knowledgeForAnswer(facts, [...previous, user('А без интернета?')])
  assert.equal(followup.topical[0].product, 'Справка: GEO5 без интернета')
  const changed = knowledgeForAnswer(facts, [...previous, user('А ремонт плоттера у вас есть?')], {
    title: 'GEO5',
    path: '/geo5',
  })
  assert.deepEqual(
    changed.topical.map((fact) => fact.product),
    ['Справка: ремонт плоттеров'],
  )
})

test('общие записи не зависят от порядка; импорт и ручные факты ищутся вместе', () => {
  const entries = [
    { product: ' Все ', text: 'Компания работает в Астане.', position: 9999 },
    { product: 'GEO5', text: 'GEO5 работает без интернета после переноса лицензии.', position: 5 },
    {
      product: 'GEO5',
      text: 'GEO5 работает без интернета после переноса лицензии.',
      position: 2005,
    },
  ]
  const selected = knowledgeForAnswer(entries, [user('GEO5 без интернета')])
  assert.equal(selected.general.length, 1)
  assert.equal(selected.topical.length, 1)
  assert.deepEqual(
    knowledgeForAnswer(
      entries.map((fact) => ({ ...fact, position: 10000 })),
      [user('GEO5 без интернета')],
    ).topical.map((fact) => fact.text),
    selected.topical.map((fact) => fact.text),
  )
})

test('знаний по неизвестному продукту не выдумываем; пустой вопрос не выбирает всё', () => {
  assert.deepEqual(pickFacts(facts, ''), [])
  assert.deepEqual(pickFacts(facts, 'привет'), [])
  assert.deepEqual(pickFacts(facts, 'GEO5 без интернета', 0), [])
})

test('предложения ассистента не подменяют явно выбранный клиентом продукт', () => {
  const result = knowledgeForAnswer(facts, [
    user('Меня интересует GEO5'),
    assistant('Есть GEO5 и SCAD Office.'),
    user('А без интернета?'),
  ])
  assert.equal(result.topical.length, 1)
  assert.equal(result.topical[0].product, 'Справка: GEO5 без интернета')
})

test('3D-сканер не подбирает справку о сканировании бумажных чертежей', () => {
  const result = pickFacts(facts, 'Нужен 3D-сканер для деталей')
  assert.ok(result.some((fact) => /Artec/.test(fact.product)))
  assert.ok(result.every((fact) => !/WideTEK/.test(fact.product)))
})

test('слово Office не смешивает SCAD с другими семействами', () => {
  const result = pickFacts(
    [
      { product: 'SCAD Office', text: 'Расчёт несущих конструкций.' },
      { product: 'Microsoft Office', text: 'Работа с документами.' },
    ],
    'SCAD',
  )
  assert.deepEqual(
    result.map((fact) => fact.product),
    ['SCAD Office'],
  )
})

test('все 76 названий исходного корпуса находят собственную справку', () => {
  for (const product of new Set(imported.map((fact) => fact.product)))
    assert.ok(
      pickFacts(imported, product, 16).some((fact) => fact.product === product),
      product,
    )
})

test('номер модели сохраняется при коротком продолжении разговора', () => {
  const entries = [
    { product: 'imagePROGRAF TX-3200', text: 'Ширина печати 36 дюймов.' },
    { product: 'imagePROGRAF TX-4200', text: 'Ширина печати 44 дюйма.' },
  ]
  const result = knowledgeForAnswer(entries, [
    user('Интересует imagePROGRAF TX-4200'),
    user('Какая ширина печати?'),
  ])
  assert.equal(result.topical[0].product, 'imagePROGRAF TX-4200')
})

test('поиск сканера документов не привязан к единственному производителю', () => {
  const result = pickFacts(
    [
      { product: 'Другой сканер', text: 'Широкоформатный сканер для чертежей A0.' },
      { product: 'imagePROGRAF', text: 'Плоттер для печати чертежей A0.' },
    ],
    'Нужен сканер документов A0',
  )
  assert.deepEqual(
    result.map((fact) => fact.product),
    ['Другой сканер'],
  )
})
