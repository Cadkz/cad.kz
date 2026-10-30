import assert from 'node:assert/strict'
import { test } from 'node:test'
import {
  countByGroup,
  filterPriceRows,
  parseAmount,
  priceChange,
  priceEditSummary,
  priceFolders,
  RATE,
  rateStart,
  todayInAstana,
} from '../src/domain/priceEdit.mjs'

test('цена, как её вводят люди: пробелы, запятая, лишние нули', () => {
  assert.equal(parseAmount('1 145 337,6'), '1145337.6')
  assert.equal(parseAmount('1 200'), '1200')
  assert.equal(parseAmount('0550.50'), '550.5')
  assert.equal(parseAmount('550.'), '550')
  assert.equal(parseAmount('550,00'), '550')
  assert.equal(parseAmount('0'), '0')
  assert.equal(parseAmount(''), null)
  assert.equal(parseAmount('12 000 тг'), null)
  assert.equal(parseAmount('-5'), null)
  assert.equal(parseAmount('1.2.3'), null)
  assert.equal(parseAmount('6,1234567', RATE), null)
  assert.equal(parseAmount('6,12', RATE), '6.12')
})

test('изменение цены: проценты, знак и порог 30 %', () => {
  assert.deepEqual(priceChange('100000', '112000'), { percent: 12, text: '+12 %', big: false })
  assert.deepEqual(priceChange('100000', '97000'), { percent: -3, text: '−3 %', big: false })
  assert.equal(priceChange('100000', '130000')?.big, false, 'ровно 30 % — ещё не «больше»')
  assert.equal(priceChange('100000', '130001')?.big, true)
  assert.equal(priceChange('100000', '69000')?.big, true)
  assert.equal(priceChange('1000', '1004')?.text, '+0,4 %')
  assert.equal(priceChange('100000', '100000'), null)
  assert.equal(priceChange(null, '100'), null)
  assert.equal(priceChange('0', '5000')?.big, true, 'с нуля — всегда проверить')
})

const rows = [
  {
    id: 1,
    label: 'AutoCAD · 1 год',
    vendor: 1,
    section: 10,
    currency: 'KZT',
    published: true,
    noPrice: false,
  },
  {
    id: 2,
    label: 'SCAD Office · S392',
    vendor: 2,
    section: 11,
    currency: 'KZT',
    published: true,
    noPrice: false,
  },
  {
    id: 3,
    label: 'GEO5 Свая',
    vendor: 3,
    section: 12,
    currency: 'EUR',
    published: false,
    noPrice: false,
  },
  {
    id: 4,
    label: 'Artec Leo',
    vendor: 4,
    section: 13,
    currency: 'USD',
    published: true,
    noPrice: true,
  },
]
const ids = (list) => list.map((row) => row.id)

test('фильтры таблицы цен', () => {
  assert.deepEqual(ids(filterPriceRows(rows, {})), [1, 2, 3, 4])
  assert.deepEqual(ids(filterPriceRows(rows, { query: 'scad s392' })), [2])
  assert.deepEqual(ids(filterPriceRows(rows, { query: '3' })), [2, 3], 'ID тоже ищется')
  assert.deepEqual(ids(filterPriceRows(rows, { vendor: 3 })), [3])
  assert.deepEqual(ids(filterPriceRows(rows, { section: 13 })), [4])
  assert.deepEqual(ids(filterPriceRows(rows, { currency: 'KZT' })), [1, 2])
  assert.deepEqual(ids(filterPriceRows(rows, { status: 'draft' })), [3])
  assert.deepEqual(ids(filterPriceRows(rows, { status: 'published' })), [1, 2, 4])
  assert.deepEqual(ids(filterPriceRows(rows, { noPrice: true })), [4])
  assert.deepEqual(ids(filterPriceRows(rows, { edited: new Set([2, 4]) })), [2, 4])
})

test('цены папками: вкладка, папка производителя, «Без производителя», подсказка по вкладкам', () => {
  const tree = [
    { id: 1, productId: 10, label: 'AutoCAD', vendor: 1, group: 'software', noPrice: false },
    { id: 2, productId: 10, label: 'AutoCAD 3 года', vendor: 1, group: 'software', noPrice: true },
    { id: 3, productId: 11, label: 'ЛИРА', vendor: 2, group: 'software', noPrice: false },
    { id: 4, productId: 12, label: 'Курс AutoCAD', vendor: null, group: 'service', noPrice: false },
    { id: 5, productId: 13, label: 'Плоттер', vendor: 1, group: 'hardware', noPrice: false },
  ].map((row) => ({ section: null, currency: 'KZT', published: true, ...row }))
  assert.deepEqual(ids(filterPriceRows(tree, { group: 'software' })), [1, 2, 3])
  assert.deepEqual(ids(filterPriceRows(tree, { group: 'software', vendor: 1 })), [1, 2])
  assert.deepEqual(ids(filterPriceRows(tree, { vendor: 'none' })), [4])
  const titles = new Map([
    [1, 'Autodesk'],
    [2, 'ЛИРА софт'],
  ])
  assert.deepEqual(priceFolders(filterPriceRows(tree, { group: 'software' }), titles), [
    // Как в русском алфавитном порядке: кириллица раньше латиницы.
    { vendor: 2, title: 'ЛИРА софт', products: 1, offers: 1, noPrice: 0 },
    { vendor: 1, title: 'Autodesk', products: 1, offers: 2, noPrice: 1 },
  ])
  assert.equal(priceFolders(tree, titles).at(-1)?.title, 'Без производителя')
  assert.deepEqual(countByGroup(filterPriceRows(tree, { query: 'autocad' })), {
    software: 2,
    service: 1,
  })
})

test('запись в журнале', () => {
  assert.equal(priceEditSummary({ changed: 12 }), 'Цены таблицей: изменено 12')
  assert.equal(
    priceEditSummary({ changed: 3, big: 1, conflicts: 2 }),
    'Цены таблицей: изменено 3, из них больше 30 % — 1; не записано 2 (цену уже поменяли)',
  )
})

test('курс: сегодня — сразу, будущий день — с полуночи по Астане, прошлое нельзя', () => {
  const now = new Date('2026-10-15T20:30:00Z') // 16.10, 01:30 по Астане
  assert.equal(todayInAstana(now), '2026-10-16')
  assert.deepEqual(rateStart('2026-10-16', now), { at: now.toISOString() })
  assert.deepEqual(rateStart('2026-10-20', now), { at: '2026-10-19T19:00:00.000Z' })
  assert.ok('error' in rateStart('2026-10-15', now))
  assert.ok('error' in rateStart('', now))
  assert.ok('error' in rateStart('2028-01-01', now))
})
