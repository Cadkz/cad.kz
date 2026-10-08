import assert from 'node:assert/strict'
import test from 'node:test'
import { toBitrix24Lead } from '../src/domain/bitrix24.mjs'
import { buildOrderSnapshot, toCrmLead } from '../src/domain/order.mjs'
import {
  AmbiguousDeliveryError,
  attemptDelivery,
  backoffMs,
  MAX_ATTEMPTS,
} from '../src/domain/outbox.mjs'
import { createRateLimiter } from '../src/domain/rateLimit.mjs'
import { BIN, createWorld, KEY, NOW } from './fixtures.mjs'

async function lead() {
  const world = createWorld()
  const priced = await world.deps.priceCart([{ offerId: '11', quantity: 2 }])
  return toCrmLead({
    number: 'CAD-20261008-AAAAA',
    idempotencyKey: KEY,
    consent: { at: NOW.toISOString(), version: 'v1' },
    buyer: {
      type: 'company',
      name: 'Алия Нурланова',
      phone: '+77011234567',
      email: 'office@company.kz',
      companyName: 'ТОО Проект-Сервис',
      bin: BIN,
    },
    comment: 'Нужен счёт',
    snapshot: buildOrderSnapshot({ lines: priced.lines, quotedAt: priced.quotedAt }),
  })
}

const demoGateway = { deliver: async () => ({ status: 'not-sent-demo' }) }

test('лид Битрикс24 собирается из заявки и содержит ключ для сверки', async () => {
  const source = await lead()
  const { method, params } = toBitrix24Lead(source)
  const { fields } = params
  assert.equal(method, 'crm.lead.add')
  assert.equal(fields.TITLE, 'Заявка с сайта CAD-20261008-AAAAA')
  assert.equal(fields.COMPANY_TITLE, 'ТОО Проект-Сервис')
  assert.deepEqual(fields.PHONE, [{ VALUE: '+77011234567', VALUE_TYPE: 'WORK' }])
  assert.equal(fields.OPPORTUNITY, '5846400')
  assert.equal(fields.CURRENCY_ID, 'KZT')
  assert.equal(fields.ORIGIN_ID, KEY)
  assert.match(fields.COMMENTS, /: 2 шт\. × .*₸ = .*₸/)
  assert.match(fields.COMMENTS, new RegExp(source.items[0].title))
  assert.match(fields.COMMENTS, new RegExp(`БИН: ${BIN}`))
  assert.match(fields.COMMENTS, /Нужен счёт/)
})

test('тестовая доставка: без сети и без обещаний, состояние — не отправлено', async () => {
  const originalFetch = globalThis.fetch
  let calls = 0
  globalThis.fetch = async () => {
    calls++
    throw new Error('сеть в тестовом адаптере запрещена')
  }
  try {
    const patch = await attemptDelivery({ snapshot: await lead(), attempts: 0 }, demoGateway, NOW)
    assert.equal(patch.state, 'not-sent-demo')
    assert.equal(patch.attempts, 1)
    assert.equal(patch.externalId, undefined)
    assert.equal(patch.nextAttemptAt, null)
    assert.equal(calls, 0)
  } finally {
    globalThis.fetch = originalFetch
  }
})

test('успешная отправка сохраняет внешний номер', async () => {
  const patch = await attemptDelivery(
    { snapshot: await lead(), attempts: 1 },
    { deliver: async () => ({ status: 'sent', externalId: '4821' }) },
    NOW,
  )
  assert.deepEqual([patch.state, patch.externalId, patch.attempts], ['sent', '4821', 2])
})

test('ошибка: следующая попытка с нарастающей паузой, потом dead-letter', async () => {
  const failing = {
    deliver: async () => {
      throw new Error('CRM недоступна')
    },
  }
  const first = await attemptDelivery({ snapshot: await lead(), attempts: 0 }, failing, NOW)
  assert.equal(first.state, 'failed')
  assert.equal(first.lastError, 'CRM недоступна')
  assert.equal(first.nextAttemptAt, new Date(NOW.getTime() + 60_000).toISOString())

  const last = await attemptDelivery(
    { snapshot: await lead(), attempts: MAX_ATTEMPTS - 1 },
    failing,
    NOW,
  )
  assert.equal(last.state, 'dead')

  assert.deepEqual(
    [1, 2, 3, 4, 5, 6, 7, 8].map(backoffMs),
    [60_000, 120_000, 240_000, 480_000, 960_000, 1_920_000, 3_600_000, 3_600_000],
  )
})

test('неясный итог: перед повтором сверяемся с CRM и не создаём лид второй раз', async () => {
  let creates = 0
  const gateway = {
    deliver: async () => {
      creates++
      throw new AmbiguousDeliveryError('таймаут')
    },
    find: async (key) => (key === KEY && creates > 0 ? { externalId: '77' } : null),
  }
  const first = await attemptDelivery({ snapshot: await lead(), attempts: 0 }, gateway, NOW)
  assert.equal(first.state, 'failed')
  assert.equal(first.ambiguous, true)

  const second = await attemptDelivery(
    { snapshot: await lead(), attempts: first.attempts, ambiguous: first.ambiguous },
    gateway,
    NOW,
  )
  assert.deepEqual([second.state, second.externalId], ['sent', '77'])
  assert.equal(creates, 1, 'лид не создавался повторно')
})

test('ограничитель частоты: лимит в окне, потом ожидание, ключи независимы', () => {
  const limiter = createRateLimiter({ limit: 3, windowMs: 60_000 })
  const t = 1_000_000
  assert.equal(limiter.check('ip-1', t).allowed, true)
  assert.equal(limiter.check('ip-1', t + 1000).allowed, true)
  assert.equal(limiter.check('ip-1', t + 2000).allowed, true)
  const blocked = limiter.check('ip-1', t + 3000)
  assert.equal(blocked.allowed, false)
  assert.equal(blocked.retryAfterMs, 57_000)
  assert.equal(limiter.check('ip-2', t + 3000).allowed, true)
  assert.equal(limiter.check('ip-1', t + 60_001).allowed, true)
})

test('ограничитель не растёт без предела', () => {
  const limiter = createRateLimiter({ limit: 1, windowMs: 60_000, maxKeys: 3 })
  for (let i = 0; i < 10; i++) limiter.check(`ip-${i}`, 1000)
  // Самые давние ключи забыты, значит ip-0 снова может обратиться.
  assert.equal(limiter.check('ip-0', 1001).allowed, true)
  assert.equal(limiter.check('ip-9', 1002).allowed, false)
})

test('диалог с консультантом попадает в комментарий лида целиком', async () => {
  const source = await lead()
  const { fields } = toBitrix24Lead({
    ...source,
    messages: [
      { role: 'user', content: 'Подойдёт ли GEO5 для подпорных стен?' },
      { role: 'assistant', content: 'Да, есть модуль для подпорных стен.' },
    ],
  }).params
  assert.match(fields.COMMENTS, /Диалог с консультантом на сайте:/)
  assert.match(fields.COMMENTS, /Клиент: Подойдёт ли GEO5/)
  assert.match(fields.COMMENTS, /Консультант: Да, есть модуль/)
})
