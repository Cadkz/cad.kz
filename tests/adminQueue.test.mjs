import assert from 'node:assert/strict'
import { test } from 'node:test'
import {
  crmSummary,
  priceListSummary,
  rateSummary,
  shortDate,
  vatSummary,
} from '../src/domain/activity.mjs'
import {
  daysLeftText,
  levelRank,
  productGaps,
  promoEnd,
  promosEndingSoon,
} from '../src/domain/adminQueue.mjs'

const NOW = new Date('2026-10-15T07:00:00Z') // 12:00 по Астане

test('конец акции: своя дата или полгода от начала показа', () => {
  assert.equal(
    promoEnd({ endsAt: '2026-10-20T00:00:00Z' })?.toISOString(),
    '2026-10-20T00:00:00.000Z',
  )
  assert.equal(
    promoEnd({ publishedAt: '2026-05-01T00:00:00Z' })?.toISOString(),
    '2026-10-28T00:00:00.000Z',
  )
  assert.equal(promoEnd({}), null)
})

test('заканчивающиеся акции: сегодня–7 дней, ближайшие первыми, прошедшие не берутся', () => {
  const promos = [
    { id: 1, endsAt: '2026-10-21T19:00:00Z' }, // 22.10 по Астане — через 7 дней
    { id: 2, endsAt: '2026-10-15T18:00:00Z' }, // сегодня 23:00 по Астане
    { id: 3, endsAt: '2026-10-14T10:00:00Z' }, // вчера — уже архив
    { id: 4, endsAt: '2026-10-23T10:00:00Z' }, // через 8 дней — рано
    { id: 5, publishedAt: '2026-04-18T10:00:00Z' }, // без даты: +180 дней = 15.10
  ]
  const soon = promosEndingSoon(promos, NOW)
  assert.deepEqual(
    soon.map((p) => [p.id, p.daysLeft]),
    [
      [5, 0],
      [2, 0],
      [1, 7],
    ],
  )
})

test('подпись срока акции', () => {
  assert.equal(daysLeftText(0), 'сегодня последний день')
  assert.equal(daysLeftText(1), 'до завтра')
  assert.equal(daysLeftText(3), 'ещё 3 дня')
  assert.equal(daysLeftText(5), 'ещё 5 дней')
})

test('недостатки карточки товара', () => {
  const full = { offers: 2, priced: 1, hasImage: true, hasDescription: true, needsPrice: true }
  assert.deepEqual(productGaps(full), [])
  assert.deepEqual(productGaps({ ...full, offers: 0, priced: 0 }), ['offers'])
  assert.deepEqual(productGaps({ ...full, priced: 0 }), ['price'])
  // Оборудование и корпоративное ПО продаются по запросу — без цены это не недостаток.
  assert.deepEqual(productGaps({ ...full, priced: 0, needsPrice: false }), [])
  assert.deepEqual(productGaps({ ...full, hasImage: false, hasDescription: false }), [
    'image',
    'description',
  ])
})

test('флагманы и топы — первыми', () => {
  assert.ok(levelRank('flagship') < levelRank('top'))
  assert.ok(levelRank('top') < levelRank(null))
  assert.ok(levelRank(null) < levelRank('low'))
})

test('тексты журнала', () => {
  assert.equal(shortDate('2026-09-30T20:00:00Z'), '1.10.2026')
  assert.equal(
    rateSummary({ currency: 'USD', kztPerUnit: '560', effectiveAt: '2026-10-01T00:00:00Z' }, '550'),
    'USD: 560 ₸ с 1.10.2026 (было 550 ₸)',
  )
  assert.equal(
    rateSummary({ currency: 'EUR', kztPerUnit: '550', effectiveAt: '2026-10-01T00:00:00Z' }, null),
    'EUR: 550 ₸ с 1.10.2026',
  )
  assert.equal(vatSummary('16', '12'), 'НДС 16 % (было 12 %)')
  assert.equal(
    priceListSummary({ file: 'SCAD.ods', changed: 3, same: 10, missing: 1 }),
    'Прайс SCAD.ods: изменено цен 3, без изменений 10, не найдено 1',
  )
})

test('журнал CRM: только смена состояния на отправлено или ошибку', () => {
  assert.equal(crmSummary({ state: 'pending' }, null, 'Заказ 1'), null)
  assert.equal(crmSummary({ state: 'sent' }, 'sent', 'Заказ 1'), null)
  assert.equal(crmSummary({ state: 'sent' }, 'processing', 'Заказ 1'), 'Заказ 1: передано в CRM')
  assert.equal(
    crmSummary({ state: 'dead', lastError: 'нет доступа' }, 'failed', 'Заявка Z-1'),
    'Заявка Z-1: не передано в CRM, попытки закончились: нет доступа',
  )
})
