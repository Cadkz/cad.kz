import assert from 'node:assert/strict'
import test from 'node:test'
import { CartUnavailableError, HOURLY_LIMIT, submitCheckout } from '../src/domain/checkout.mjs'
import { createWorld, formRequest, KEY } from './fixtures.mjs'

const meta = { clientHash: 'client-1' }

test('успешное оформление: заказ со снимком и запись очереди CRM сохраняются вместе', async () => {
  const world = createWorld()
  const result = await submitCheckout(formRequest(), world.deps, meta)

  assert.equal(result.status, 'created')
  assert.equal(result.idempotencyKey, KEY, 'по ключу заявку находит очередь CRM')
  assert.match(result.order.number, /^CAD-20261008-[A-Z0-9]{5}$/)
  assert.equal(result.order.totalKzt, '5846400')
  assert.equal(result.order.mode, 'demo')
  assert.equal(world.orders.length, 1)
  assert.equal(world.outbox.length, 1)

  const [saved] = world.orders
  assert.equal(saved.snapshot.totalKzt, '5846400')
  assert.equal(saved.snapshot.lines[0].rate.kztPerUnit, '600')
  assert.equal(saved.consent.accepted, true)
  assert.equal(saved.consent.version.startsWith('demo-'), true)
  assert.equal(saved.buyer.phone, '+77011234567')
  assert.equal(saved.clientHash, 'client-1')
  assert.equal(world.outbox[0].idempotencyKey, saved.idempotencyKey)
  assert.equal(world.outbox[0].state, 'pending')
  assert.equal(world.outbox[0].snapshot.orderNumber, saved.number)
})

test('повторная отправка той же формы не создаёт дубль и возвращает тот же заказ', async () => {
  const world = createWorld()
  const first = await submitCheckout(formRequest(), world.deps, meta)
  const again = await submitCheckout(formRequest(), world.deps, meta)

  assert.equal(again.status, 'repeated')
  assert.equal(again.order.number, first.order.number)
  assert.equal(world.orders.length, 1)
  assert.equal(world.outbox.length, 1)
  assert.equal(world.saveCalls, 1)
})

test('повтор не пересчитывает цену: курс изменился, а заказ остаётся прежним', async () => {
  const world = createWorld()
  const first = await submitCheckout(formRequest(), world.deps, meta)
  world.rates.EUR = { value: '700', date: '2026-10-09T00:00:00.000Z' }

  const again = await submitCheckout(formRequest(), world.deps, meta)
  assert.equal(again.status, 'repeated')
  assert.equal(again.order.totalKzt, first.order.totalKzt)
})

test('двойной клик: два одновременных запроса дают один заказ', async () => {
  const world = createWorld()
  // Оба запроса не нашли заказ по ключу и одновременно пошли сохранять.
  const find = world.deps.findOrderByKey
  let lookups = 0
  world.deps.findOrderByKey = async (key) => {
    lookups++
    if (lookups <= 2) return null
    return find(key)
  }
  const [a, b] = await Promise.all([
    submitCheckout(formRequest(), world.deps, meta),
    submitCheckout(formRequest(), world.deps, meta),
  ])

  assert.deepEqual([a.status, b.status].sort(), ['created', 'repeated'])
  assert.equal(a.order.number, b.order.number)
  assert.equal(world.orders.length, 1)
  assert.equal(world.outbox.length, 1)
})

test('тот же ключ с другими данными — конфликт, второй заказ не создаётся', async () => {
  const world = createWorld()
  await submitCheckout(formRequest(), world.deps, meta)
  const other = await submitCheckout(
    formRequest({ items: [{ offerId: '12', quantity: 1 }], expectedTotalKzt: '1000' }),
    world.deps,
    meta,
  )
  assert.equal(other.status, 'key_conflict')
  assert.equal(world.orders.length, 1)
})

test('новый ключ — новый заказ', async () => {
  const world = createWorld()
  world.deps.randomIndex = (() => {
    let i = 0
    return () => i++ % 32
  })()
  await submitCheckout(formRequest(), world.deps, meta)
  const second = await submitCheckout(
    formRequest({ idempotencyKey: '7c9e6679-7425-40de-944b-e07fc1f90ae7' }),
    world.deps,
    meta,
  )
  assert.equal(second.status, 'created')
  assert.equal(world.orders.length, 2)
})

test('цена изменилась: заказ не сохраняется, сервер отдаёт новую цену', async () => {
  const world = createWorld()
  world.rates.EUR = { value: '700', date: '2026-10-09T00:00:00.000Z' }

  const result = await submitCheckout(formRequest(), world.deps, meta)
  assert.equal(result.status, 'price_changed')
  assert.equal(result.quote.totalKzt, '6820800')
  assert.equal(result.quote.lines[0].unitKzt, '3410400')
  assert.equal(world.orders.length, 0)
  assert.equal(world.outbox.length, 0)
})

test('после подтверждения новой цены заказ сохраняется по новой цене и курсу', async () => {
  const world = createWorld()
  world.rates.EUR = { value: '700', date: '2026-10-09T00:00:00.000Z' }

  const changed = await submitCheckout(formRequest(), world.deps, meta)
  const confirmed = await submitCheckout(
    formRequest({ expectedTotalKzt: changed.quote.totalKzt }),
    world.deps,
    meta,
  )
  assert.equal(confirmed.status, 'created')
  assert.equal(confirmed.order.totalKzt, '6820800')
  assert.equal(world.orders[0].snapshot.lines[0].rate.kztPerUnit, '700')
  assert.equal(world.orders[0].snapshot.lines[0].rate.date, '2026-10-09T00:00:00.000Z')
})

test('цена, присланная клиентом, ничего не решает: подмена суммы не проходит', async () => {
  const world = createWorld()
  const result = await submitCheckout(formRequest({ expectedTotalKzt: '1' }), world.deps, meta)
  assert.equal(result.status, 'price_changed')
  assert.equal(result.quote.totalKzt, '5846400')
  assert.equal(world.orders.length, 0)

  const withPrices = await submitCheckout(
    formRequest({ items: [{ offerId: '11', quantity: 2, totalKzt: '1', unitKzt: '1' }] }),
    world.deps,
    meta,
  )
  assert.equal(withPrices.status, 'created')
  assert.equal(world.orders[0].snapshot.totalKzt, '5846400')
})

test('предложение снято с публикации: понятная ошибка, заказа нет', async () => {
  const world = createWorld()
  world.deps.priceCart = async () => {
    throw new CartUnavailableError('Предложение недоступно. Удалите его из корзины.')
  }
  const result = await submitCheckout(formRequest(), world.deps, meta)
  assert.deepEqual(result, {
    status: 'cart_unavailable',
    error: 'Предложение недоступно. Удалите его из корзины.',
  })
  assert.equal(world.orders.length, 0)
})

test('неверные данные отклоняются до обращения к хранилищу и расчёту', async () => {
  const world = createWorld()
  let touched = 0
  for (const name of ['findOrderByKey', 'countRecent', 'priceCart', 'saveOrder'])
    world.deps[name] = async () => {
      touched++
      return null
    }
  const result = await submitCheckout(
    formRequest({ consent: false, buyer: { type: 'individual', name: '', phone: '', email: '' } }),
    world.deps,
    meta,
  )
  assert.equal(result.status, 'invalid')
  assert.ok(result.errors.consent && result.errors.name && result.errors.phone)
  assert.equal(touched, 0)
})

test('слишком частые заявки с одного телефона или адреса останавливаются', async () => {
  for (const recent of [
    { phone: HOURLY_LIMIT.phone, client: 0 },
    { phone: 0, client: HOURLY_LIMIT.client },
  ]) {
    const world = createWorld()
    world.recent = recent
    const result = await submitCheckout(formRequest(), world.deps, meta)
    assert.equal(result.status, 'rate_limited')
    assert.equal(result.retryAfterSeconds, 3600)
    assert.equal(world.orders.length, 0)
  }
  const world = createWorld()
  world.recent = { phone: HOURLY_LIMIT.phone - 1, client: HOURLY_LIMIT.client - 1 }
  assert.equal((await submitCheckout(formRequest(), world.deps, meta)).status, 'created')
})

test('повтор уже сохранённой заявки не упирается в лимит частоты', async () => {
  const world = createWorld()
  await submitCheckout(formRequest(), world.deps, meta)
  world.recent = { phone: 99, client: 99 }
  assert.equal((await submitCheckout(formRequest(), world.deps, meta)).status, 'repeated')
})

test('совпал номер заказа: берётся другой, а не падение и не дубль', async () => {
  const world = createWorld()
  let picks = 0
  world.deps.randomIndex = () => (picks++ < 5 ? 0 : 1) // первый номер AAAAA, потом BBBBB
  // Номер AAAAA уже занят другим заказом.
  world.orders.push({ idempotencyKey: 'other', number: 'CAD-20261008-AAAAA' })

  const result = await submitCheckout(formRequest(), world.deps, meta)
  assert.equal(result.status, 'created')
  assert.equal(world.saveCalls, 2, 'первая попытка упёрлась в занятый номер')
  assert.equal(world.orders.length, 2)
  assert.equal(result.order.number, 'CAD-20261008-BBBBB')
})

test('неожиданная ошибка хранилища не маскируется под повтор', async () => {
  const world = createWorld()
  world.deps.saveOrder = async () => {
    throw new Error('база недоступна')
  }
  await assert.rejects(() => submitCheckout(formRequest(), world.deps, meta), /база недоступна/)
  assert.equal(world.orders.length, 0)
})

test('ключ из формы приводится к нижнему регистру, один и тот же ключ узнаётся', async () => {
  const world = createWorld()
  await submitCheckout(formRequest({ idempotencyKey: KEY.toUpperCase() }), world.deps, meta)
  const again = await submitCheckout(formRequest(), world.deps, meta)
  assert.equal(again.status, 'repeated')
})
