import assert from 'node:assert/strict'
import test from 'node:test'
import { parseAutodeskList, validateVendorList } from '../src/domain/vendorList.mjs'
import {
  autodeskPrices,
  newSubscription,
  planOffers,
  rckp,
  validateVendorPrices,
} from '../src/domain/vendorPrices.mjs'

test('строка новой подписки: продукт и срок, остальное — нет', () => {
  assert.deepEqual(
    newSubscription('Revit 2027 Commercial New Single-user ELD Annual Subscription'),
    { base: 'Revit', term: '1 год' },
  )
  assert.deepEqual(
    newSubscription(
      'AutoCAD - including specialized toolsets AD Commercial New Single-user ELD 3-Year Subscription',
    ),
    { base: 'AutoCAD - including specialized toolsets', term: '3 года' },
  )
  assert.deepEqual(
    newSubscription('Forma Data Management - Single User CLOUD Commercial New Annual Subscription'),
    { base: 'Forma Data Management - Single User', term: '1 год' },
  )
  assert.equal(
    newSubscription(
      'Forma Data Management - 10 Subscription CLOUD Commercial New Annual Subscription',
    ),
    null,
  )
  assert.equal(newSubscription('Revit Commercial Single-user Annual Subscription Renewal'), null)
  assert.equal(
    newSubscription(
      'Navisworks Manage 2027 Not For Resale New Single-user ELD 3-Year Subscription',
    ),
    null,
  )
})

test('цена РЦКП из ячейки', () => {
  assert.equal(rckp('1089262'), '1089262')
  assert.equal(rckp('1 089 262,50'), '1089262.5')
  assert.equal(rckp('1089262.0'), '1089262')
  assert.equal(rckp('0'), null)
  assert.equal(rckp('по запросу'), null)
})

test('цены только для товаров сайта, ELD первым', () => {
  const prices = autodeskPrices([
    { name: 'Revit 2027 Commercial New Single-user ELD Annual Subscription', price: '1796287' },
    { name: 'Revit 2027 Commercial New Single-user Annual Subscription', price: '1' },
    { name: 'Revit 2027 Commercial New Single-user ELD 3-Year Subscription', price: '5388860' },
    { name: 'Maya 2027 Commercial New Single-user ELD Annual Subscription', price: '1199130' },
  ])
  assert.deepEqual(prices, { Revit: { '1 год': '1796287', '3 года': '5388860' } })
  assert.deepEqual(validateVendorPrices(prices), prices)
  assert.equal(typeof validateVendorPrices({ Maya: { '1 год': '1' } }), 'string')
  assert.equal(typeof validateVendorPrices({ Revit: { '2 года': '1' } }), 'string')
})

const offer = (id, configuration, extra = {}) => ({
  id,
  configuration,
  license: '',
  amount: '0',
  currency: 'KZT',
  includesVat: true,
  variants: [],
  ...extra,
})

test('единственная «Базовая» — годовая, трёхлетняя создаётся', () => {
  const plan = planOffers([offer(1, 'Базовая')], { '1 год': '1796287', '3 года': '5388860' })
  assert.deepEqual(
    plan.update.map((u) => [u.id, u.term, u.data.amount, u.data.variants]),
    [[1, '1 год', '1796287', ['1 год']]],
  )
  assert.deepEqual(
    plan.create.map((c) => [c.term, c.configuration, c.data.amount]),
    [['3 года', 'Подписка на 3 года', '5388860']],
  )
  assert.equal(plan.untouched, 0)
})

test('сроки по переключателю и названию, продление не трогается', () => {
  const plan = planOffers(
    [
      offer(1, 'Подписка на 3 года'),
      offer(2, 'AutoCAD', { variants: ['1 год'], amount: '1089262' }),
      offer(3, 'Продление на 1 год'),
    ],
    { '1 год': '1089262', '3 года': '3267785' },
  )
  assert.deepEqual(
    plan.update.map((u) => [u.id, u.term, u.changed]),
    [
      [2, '1 год', false],
      [1, '3 года', true],
    ],
  )
  assert.equal(plan.create.length, 0)
  assert.equal(plan.untouched, 1)
})

test('прайс-лист отдаёт цены отдельно, Кадди их не получает', () => {
  const row = (name, sku = '', price = '') => [name, '', sku, 'WIN', 'S', price]
  const list = parseAutodeskList([
    {
      name: 'Price List',
      rows: [
        ['Effective: October 7, 2026 - November 6, 2026'],
        ['Программное обеспечение', 'Носитель', 'SKU код', 'ОС', 'Версия', 'РЦКП'],
        row('Revit 2027'),
        row('Revit 2027 Commercial New'),
        row('Revit 2027 Commercial New Single-user ELD Annual Subscription', 'R-1', '1796287'),
      ],
    },
  ])
  assert.ok(list)
  assert.deepEqual(list.prices, { Revit: { '1 год': '1796287' } })
  const stored = validateVendorList(list)
  assert.ok(typeof stored === 'object' && !('prices' in stored))
})
