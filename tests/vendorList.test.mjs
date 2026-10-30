import assert from 'node:assert/strict'
import test from 'node:test'
import { systemPrompt } from '../src/domain/assistant.mjs'
import {
  MULTI_OLD,
  parseAutodeskList,
  purchaseOptions,
  validateVendorList,
  vendorListText,
  vendorProductName,
} from '../src/domain/vendorList.mjs'

const row = (name, sku = '', price = '') => [name, '', sku, 'WIN', 'S', price, '', 'Released', '']

const sheet = {
  name: 'Price List',
  rows: [
    ['', '', '', '', '', '', '', '', ''],
    ['Effective: October 7, 2026 - November 6, 2026'],
    [
      'Программное обеспечение',
      'Носитель',
      'SKU код',
      'ОС',
      'Версия',
      'РЦКП ',
      'Класс',
      'Дата',
      '',
    ],
    row('Commercial'),
    row('Navisworks Manage 2027'),
    row('Navisworks Manage 2027 Commercial New'),
    row(
      'Navisworks Manage 2027 Commercial New Single-user ELD Annual Subscription',
      'A-1',
      '1695155',
    ),
    row(
      'Navisworks Manage 2027 Commercial New Single-user ELD 3-Year Subscription',
      'A-2',
      '5085466',
    ),
    row('Navisworks Manage Subscription Plan Renewals'),
    row('Navisworks Manage Commercial Single-user Annual Subscription Renewal', 'A-3', '1610400'),
    row('Forma Site Design CLOUD'),
    row('Forma Site Design CLOUD Commercial New'),
    row('Forma Site Design CLOUD Commercial New Single-user Annual Subscription', 'B-1', '300000'),
    row('Old Thing 2027'),
    row('Old Thing 2027 Commercial Renewal'),
    row('Old Thing Commercial Single-user Annual Subscription Renewal', 'C-1', '1'),
  ],
}

test('Прайс-лист Autodesk: продукты, способы покупки, период', () => {
  const list = parseAutodeskList([{ name: 'служебный', rows: [['Вид цены']] }, sheet])
  assert.ok(list)
  assert.equal(list.from, '2026-10-07')
  assert.equal(list.to, '2026-11-06')
  assert.deepEqual(
    list.products.map((p) => p.name),
    ['Forma Site Design', 'Navisworks Manage', 'Old Thing'],
  )
  const navis = list.products.find((p) => p.name === 'Navisworks Manage')
  assert.deepEqual(navis?.options, ['новая подписка: 1 год, 3 года', 'продление'])
  assert.equal(list.products[0]?.cloud, true)
  assert.match(list.products[2]?.options[0] ?? '', /только для действующих/)
  // Проверка на сервере пропускает то же самое, кроме цен: они идут отдельно, в цены сайта.
  const { prices, ...forKaddi } = list
  assert.deepEqual(validateVendorList(list), forKaddi)
  assert.deepEqual(prices, {
    'Forma Site Design': { '1 год': '300000' },
    'Navisworks Manage': { '1 год': '1695155', '3 года': '5085466' },
  })
  assert.equal(typeof validateVendorList({ vendor: 'X', products: [] }), 'string')
})

test('Прайс-лист: не тот файл — null; цены в правила модели не попадают', () => {
  assert.equal(parseAutodeskList([{ name: 'a', rows: [['Код', 'Цена, тенге']] }]), null)
  const list = parseAutodeskList([sheet])
  const text = vendorListText(list)
  assert.match(text, /Navisworks Manage: новая подписка/)
  assert.doesNotMatch(text, /1695155|1 695 155/)
  const [stable] = systemPrompt({
    now: new Date(),
    knowledge: [],
    vendorList: list,
    price: null,
    handoff: { state: 'none' },
    time: { state: 'work', text: '12:00' },
  })
  assert.match(stable, /Что CAD\.kz может поставить от Autodesk/)
  assert.equal(vendorListText(null), '')
})

test('Названия и способы покупки', () => {
  assert.equal(vendorProductName('Revit 2027'), 'Revit')
  assert.equal(
    vendorProductName('Media & Entertainment Collection IC'),
    'Media & Entertainment Collection',
  )
  assert.equal(vendorProductName('Fusion CLOUD'), 'Fusion')
  assert.deepEqual(purchaseOptions(['X Commercial New Multi-user Annual Subscription']), [
    'новая подписка: 1 год',
    'новые сетевые (multi-user)',
  ])
  assert.deepEqual(
    purchaseOptions([
      'X Commercial New Single-user ELD Annual Subscription',
      'X Commercial Multi-user Annual Subscription Renewal',
    ]),
    ['новая подписка: 1 год', 'продление', MULTI_OLD],
  )
})
