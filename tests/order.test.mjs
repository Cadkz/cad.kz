import assert from 'node:assert/strict'
import test from 'node:test'
import {
  buildOrderSnapshot,
  canonicalRequest,
  isValidBin,
  makeOrderNumber,
  normalizePhone,
  SNAPSHOT_VERSION,
  toCrmLead,
  validateCheckout,
  validateForm,
} from '../src/domain/order.mjs'
import { BIN, createWorld, formRequest, KEY, NOW } from './fixtures.mjs'

const company = {
  type: 'company',
  name: 'Алия Нурланова',
  phone: '+77011234567',
  email: 'office@company.kz',
  companyName: 'ТОО Проект-Сервис',
  bin: BIN,
}

test('форма физлица принимается и приводится к единому виду', () => {
  const result = validateCheckout(formRequest({ comment: '  Нужен счёт  ' }))
  assert.equal(result.ok, true)
  assert.equal(result.value.buyer.phone, '+77011234567')
  assert.equal(result.value.buyer.email, 'aliya@example.kz')
  assert.equal(result.value.comment, 'Нужен счёт')
  assert.equal(result.value.buyer.bin, undefined)
})

test('у юрлица обязательны название и БИН, у физлица они отбрасываются', () => {
  const missing = validateCheckout(formRequest({ buyer: { ...company, companyName: '', bin: '' } }))
  assert.equal(missing.ok, false)
  assert.match(missing.errors.companyName, /название организации/)
  assert.match(missing.errors.bin, /12 цифр/)

  const full = validateCheckout(formRequest({ buyer: company }))
  assert.equal(full.ok, true)
  assert.equal(full.value.buyer.bin, BIN)

  const extra = validateCheckout(
    formRequest({ buyer: { ...company, type: 'individual', companyName: 'ТОО', bin: BIN } }),
  )
  assert.equal(extra.ok, true)
  assert.equal(extra.value.buyer.companyName, undefined)
})

test('БИН проверяется по контрольной цифре', () => {
  assert.equal(isValidBin('971240001315'), true)
  assert.equal(isValidBin('940140000385'), true)
  assert.equal(isValidBin('971240001316'), false)
  assert.equal(isValidBin('97124000131'), false)
  assert.equal(isValidBin('97124000131a'), false)
  const wrong = validateCheckout(formRequest({ buyer: { ...company, bin: '971240001316' } }))
  assert.match(wrong.errors.bin, /не прошёл проверку/)
})

test('телефон: разные записи сводятся к +7XXXXXXXXXX, мусор отклоняется', () => {
  for (const value of ['8 701 123-45-67', '+7 (701) 123-45-67', '7011234567', '87011234567'])
    assert.equal(normalizePhone(value), '+77011234567', value)
  assert.equal(normalizePhone('+380501234567'), '+380501234567')
  for (const value of ['12345', '+7701123456', 'позвоните мне', '', null, 77011234567])
    assert.equal(normalizePhone(value), null, String(value))
})

test('ошибки на русском, по одному сообщению на поле, ничего не пропущено', () => {
  const result = validateCheckout({
    idempotencyKey: 'не-ключ',
    items: [],
    expectedTotalKzt: 'много',
    buyer: { type: 'другое', name: 'А', phone: '1', email: 'почта' },
    comment: 'я'.repeat(1001),
    consent: false,
  })
  assert.equal(result.ok, false)
  assert.deepEqual(Object.keys(result.errors).sort(), [
    'comment',
    'consent',
    'email',
    'expectedTotalKzt',
    'idempotencyKey',
    'items',
    'name',
    'phone',
    'type',
  ])
  for (const message of Object.values(result.errors)) assert.match(message, /[А-Яа-я]/)
})

test('согласие обязательно и принимается только как true', () => {
  for (const consent of [false, 'true', 1, undefined]) {
    const result = validateCheckout(formRequest({ consent }))
    assert.match(result.errors.consent, /согласия на обработку/)
  }
})

test('управляющие символы в полях отклоняются, переносы строк в комментарии допустимы', () => {
  assert.equal(validateCheckout(formRequest({ comment: 'раз\nдва' })).ok, true)
  assert.equal(validateCheckout(formRequest({ comment: 'раз\u0000два' })).ok, false)
  const named = validateCheckout(formRequest({ buyer: { ...company, name: 'Алия\u0007' } }))
  assert.match(named.errors.name, /имя/)
})

test('мусор вместо тела запроса не ломает проверку', () => {
  for (const raw of [null, undefined, 'строка', 42, [], { buyer: 'x', items: 'y' }])
    assert.equal(validateCheckout(raw).ok, false)
})

test('отпечаток не зависит от порядка строк и ожидаемой суммы', () => {
  const a = validateCheckout(
    formRequest({
      items: [
        { offerId: '11', quantity: 1 },
        { offerId: '12', quantity: 3 },
      ],
    }),
  ).value
  const b = validateCheckout(
    formRequest({
      items: [
        { offerId: '12', quantity: 3 },
        { offerId: '11', quantity: 1 },
      ],
      expectedTotalKzt: '1',
    }),
  ).value
  assert.equal(canonicalRequest(a), canonicalRequest(b))
  const changed = validateCheckout(formRequest({ comment: 'другое' })).value
  assert.notEqual(canonicalRequest(a), canonicalRequest(changed))
})

async function pricedLines(world, items) {
  return world.deps.priceCart(items)
}

test('снимок содержит всё, что нужно для проверки цены, и не меняется', async () => {
  const world = createWorld()
  const priced = await pricedLines(world, [
    { offerId: '11', quantity: 2 },
    { offerId: '12', quantity: 3 },
  ])
  const snapshot = buildOrderSnapshot({ lines: priced.lines, quotedAt: priced.quotedAt })

  assert.equal(snapshot.version, SNAPSHOT_VERSION)
  assert.equal(snapshot.rule, 'KZT-unit-half-up-v1')
  assert.equal(snapshot.currency, 'KZT')
  assert.equal(snapshot.quotedAt, NOW.toISOString())
  assert.equal(snapshot.targetVat, '16')
  assert.equal(snapshot.totalKzt, '5849400')

  const [geo, leo] = snapshot.lines
  assert.deepEqual(geo, {
    offerId: '11',
    productSlug: 'geo5-stability',
    productTitle: 'GEO5 Расчёт устойчивости',
    configuration: 'Стандарт',
    license: 'Бессрочная',
    quantity: 2,
    source: { amount: '4200', currency: 'EUR', includesVat: false, vat: '16' },
    rate: { kztPerUnit: '600', date: '2026-10-01T00:00:00.000Z' },
    unitKzt: '2923200',
    totalKzt: '5846400',
    vatMinor: geo.vatMinor,
  })
  assert.deepEqual(leo.rate, { kztPerUnit: '1', date: null })
  assert.equal(leo.source.includesVat, true)
  assert.equal(
    snapshot.vatMinor,
    (BigInt(geo.vatMinor) + BigInt(leo.vatMinor)).toString(),
    'НДС заказа — сумма НДС строк',
  )

  assert.equal(Object.isFrozen(snapshot), true)
  assert.equal(Object.isFrozen(snapshot.lines[0].source), true)
  assert.throws(() => {
    snapshot.totalKzt = '1'
  }, TypeError)
  assert.throws(() => {
    snapshot.lines[0].rate.kztPerUnit = '1'
  }, TypeError)
})

test('снимок не зависит от дальнейших правок курса и каталога', async () => {
  const world = createWorld()
  const priced = await pricedLines(world, [{ offerId: '11', quantity: 1 }])
  const snapshot = buildOrderSnapshot({ lines: priced.lines, quotedAt: priced.quotedAt })
  world.rates.EUR = { value: '700', date: '2026-10-09T00:00:00.000Z' }
  world.offers.get('11').title = 'Новое название'
  assert.equal(snapshot.lines[0].rate.kztPerUnit, '600')
  assert.equal(snapshot.lines[0].productTitle, 'GEO5 Расчёт устойчивости')
  assert.equal(snapshot.totalKzt, '2923200')
})

test('снимок отказывается собираться из пустых или разнородных строк', async () => {
  assert.throws(() => buildOrderSnapshot({ lines: [], quotedAt: NOW.toISOString() }), /нет строк/)
  const world = createWorld()
  const { lines } = await pricedLines(world, [{ offerId: '11', quantity: 1 }])
  assert.throws(
    () =>
      buildOrderSnapshot({
        lines: [lines[0], { ...lines[0], rule: 'другое-правило' }],
        quotedAt: NOW.toISOString(),
      }),
    /разным правилам/,
  )
})

test('номер заказа: дата по Казахстану и пять символов без похожих букв', () => {
  const picks = [0, 1, 2, 3, 31]
  let i = 0
  const number = makeOrderNumber(new Date('2026-10-08T21:30:00.000Z'), () => picks[i++])
  assert.equal(number, 'CAD-20261009-ABCD9')
  assert.match(
    makeOrderNumber(NOW, () => 5),
    /^CAD-20261008-[A-HJ-NP-Z2-9]{5}$/,
  )
})

test('данные для CRM берутся из сохранённого заказа', async () => {
  const world = createWorld()
  const priced = await pricedLines(world, [{ offerId: '11', quantity: 2 }])
  const order = {
    number: 'CAD-20261008-AAAAA',
    idempotencyKey: KEY,
    consent: { at: NOW.toISOString(), version: 'v1' },
    buyer: company,
    comment: 'Нужен счёт',
    snapshot: buildOrderSnapshot({ lines: priced.lines, quotedAt: priced.quotedAt }),
  }
  const lead = toCrmLead(order)
  assert.deepEqual(lead.buyer, { type: 'company', companyName: 'ТОО Проект-Сервис', bin: BIN })
  assert.deepEqual(lead.items, [{ offerId: '11', quantity: 2, totalKzt: '5846400' }])
  assert.equal(lead.totalKzt, '5846400')
  assert.equal(lead.idempotencyKey, KEY)
  assert.equal(lead.consent.accepted, true)
  assert.deepEqual(toCrmLead({ ...order, buyer: { ...company, type: 'individual' } }).buyer, {
    type: 'individual',
  })
})

test('форма в браузере проверяется теми же правилами, без корзины и ключа', () => {
  const ok = validateForm({ buyer: company, comment: ' привет ', consent: true })
  assert.equal(ok.ok, true)
  assert.equal(ok.value.comment, 'привет')
  assert.equal(ok.value.buyer.bin, BIN)

  const bad = validateForm({ buyer: { type: 'company', name: '' }, consent: false })
  assert.deepEqual(Object.keys(bad.errors).sort(), [
    'bin',
    'companyName',
    'consent',
    'email',
    'name',
    'phone',
  ])
  assert.equal(validateForm(null).ok, false)
})
