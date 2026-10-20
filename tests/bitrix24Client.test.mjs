import assert from 'node:assert/strict'
import test from 'node:test'
import { TEST_MARK, toBitrix24Lead, toBitrix24Rows } from '../src/domain/bitrix24.mjs'
import {
  Bitrix24Error,
  createBitrix24Client,
  parseWebhookUrl,
} from '../src/domain/bitrix24Client.mjs'
import { AmbiguousDeliveryError, attemptDelivery } from '../src/domain/outbox.mjs'
import { KEY, NOW } from './fixtures.mjs'

const WEBHOOK = 'https://cadkz.bitrix24.kz/rest/17/s3cr3tkey123/'

function lead(overrides = {}) {
  return {
    idempotencyKey: KEY,
    orderNumber: 'CAD-20261020-ABCDE',
    consent: { accepted: true, at: NOW.toISOString(), version: 'v1' },
    contact: { name: 'Алия', phone: '+77011234567' },
    buyer: { type: 'individual' },
    items: [
      {
        offerId: '11',
        title: 'GEO5 Сваи',
        configuration: 'Personal',
        license: 'Бессрочная',
        quantity: 2,
        unitKzt: '2923200',
        totalKzt: '5846400',
      },
    ],
    totalKzt: '5846400',
    messages: [],
    ...overrides,
  }
}

/** Подставной портал: лиды в памяти, журнал вызовов. Поведение методов можно переопределить. */
function fakePortal(handlers = {}) {
  const leads = []
  const calls = []
  const fetch = async (url, init) => {
    const method = url.replace(WEBHOOK, '').replace(/\.json$/, '')
    const params = JSON.parse(init.body)
    calls.push({ url, method, params })
    if (handlers[method]) return handlers[method](params, leads)
    const ok = (result) => new Response(JSON.stringify({ result }), { status: 200 })
    if (method === 'crm.lead.list')
      return ok(leads.filter((row) => row.ORIGIN_ID === params.filter.ORIGIN_ID))
    if (method === 'crm.lead.add') {
      const id = String(100 + leads.length)
      leads.push({ ID: id, ...params.fields, rows: [] })
      return ok(Number(id))
    }
    if (method === 'crm.lead.productrows.set') {
      const row = leads.find((item) => item.ID === params.id)
      row.rows = params.rows
      return ok(true)
    }
    return new Response(JSON.stringify({ error: 'ERROR_METHOD_NOT_FOUND' }), { status: 404 })
  }
  return { fetch, leads, calls }
}

test('адрес вебхука: только https и /rest/<id>/<ключ>/, наружу — домен без ключа', () => {
  assert.deepEqual(parseWebhookUrl(`${WEBHOOK.slice(0, -1)}`), {
    base: WEBHOOK,
    host: 'cadkz.bitrix24.kz',
    userId: '17',
  })
  assert.equal(parseWebhookUrl('http://cadkz.bitrix24.kz/rest/17/key/'), null)
  assert.equal(parseWebhookUrl('https://cadkz.bitrix24.kz/crm/lead/'), null)
  assert.equal(parseWebhookUrl(''), null)
  assert.equal(parseWebhookUrl(undefined), null)
})

test('лид с товарами: создаётся лид, затем строки товаров с ценой за единицу', async () => {
  const portal = fakePortal()
  const client = createBitrix24Client({ webhookUrl: WEBHOOK, fetch: portal.fetch })
  const result = await client.deliver(lead())
  assert.deepEqual(result, { status: 'sent', externalId: '100' })
  assert.deepEqual(
    portal.calls.map((call) => call.method),
    ['crm.lead.list', 'crm.lead.add', 'crm.lead.productrows.set'],
  )
  const saved = portal.leads[0]
  assert.equal(saved.TITLE, 'Заказ из корзины cad.kz: GEO5 Сваи (CAD-20261020-ABCDE)')
  assert.equal(saved.ORIGIN_ID, KEY)
  assert.deepEqual(saved.rows, [
    {
      PRODUCT_ID: 0,
      PRODUCT_NAME: 'GEO5 Сваи, Personal, Бессрочная',
      PRICE: '2923200',
      QUANTITY: 2,
      MEASURE_CODE: 796,
      MEASURE_NAME: 'шт',
    },
  ])
})

test('демоверсия: лид с пометкой ТЕСТ и на ответственного из настроек', async () => {
  const portal = fakePortal()
  const client = createBitrix24Client({
    webhookUrl: WEBHOOK,
    fetch: portal.fetch,
    test: true,
    responsibleId: '42',
  })
  await client.deliver(lead())
  assert.ok(portal.leads[0].TITLE.startsWith(`${TEST_MARK} · `))
  assert.equal(portal.leads[0].ASSIGNED_BY_ID, '42')
})

test('повтор после обрыва: лид уже есть — второй не создаётся, товары задаются заново', async () => {
  const portal = fakePortal()
  const client = createBitrix24Client({ webhookUrl: WEBHOOK, fetch: portal.fetch })
  await client.deliver(lead())
  const again = await client.deliver(lead())
  assert.equal(again.externalId, '100')
  assert.equal(portal.leads.length, 1)
  assert.equal(portal.leads[0].rows.length, 1)
})

test('портал не фильтрует по ключу и отдаёт чужие лиды — чужой лид не принимается за наш', async () => {
  const portal = fakePortal({
    'crm.lead.list': (_params, leads) =>
      new Response(
        JSON.stringify({ result: [{ ID: '7', ORIGINATOR_ID: '', ORIGIN_ID: '' }, ...leads] }),
      ),
  })
  const client = createBitrix24Client({ webhookUrl: WEBHOOK, fetch: portal.fetch })
  const result = await client.deliver(lead())
  assert.equal(result.externalId, '100')
  assert.equal(portal.leads.length, 1)
})

test('заявка без цены: строка с ценой 0, без корзины строк нет', async () => {
  const rows = toBitrix24Rows(
    lead({ items: [{ ...lead().items[0], unitKzt: '', totalKzt: '', license: '—' }] }),
  )
  assert.equal(rows[0].PRICE, '0')
  assert.equal(rows[0].PRODUCT_NAME, 'GEO5 Сваи, Personal')
  const portal = fakePortal()
  const client = createBitrix24Client({ webhookUrl: WEBHOOK, fetch: portal.fetch })
  await client.deliver(lead({ items: [] }))
  assert.deepEqual(
    portal.calls.map((call) => call.method),
    ['crm.lead.list', 'crm.lead.add'],
  )
})

test('ошибка портала: понятный текст без адреса вебхука, очередь ждёт повтора', async () => {
  const portal = fakePortal({
    'crm.lead.add': () =>
      new Response(
        JSON.stringify({
          error: 'insufficient_scope',
          error_description: `Нет прав, ${WEBHOOK}crm.lead.add`,
        }),
        { status: 401 },
      ),
  })
  const client = createBitrix24Client({ webhookUrl: WEBHOOK, fetch: portal.fetch })
  await assert.rejects(client.deliver(lead()), (error) => {
    assert.ok(error instanceof Bitrix24Error)
    assert.equal(error.code, 'insufficient_scope')
    assert.doesNotMatch(error.message, /s3cr3tkey123/)
    return true
  })
  const patch = await attemptDelivery({ snapshot: lead(), attempts: 0 }, client, NOW)
  assert.equal(patch.state, 'failed')
  assert.equal(patch.ambiguous, false)
  assert.doesNotMatch(patch.lastError, /s3cr3tkey123/)
})

test('обрыв связи — неясный итог: следующая попытка сначала ищет лид', async () => {
  let broken = true
  const portal = fakePortal()
  const fetch = async (url, init) => {
    if (broken && url.endsWith('crm.lead.add.json')) {
      await portal.fetch(url, init)
      broken = false
      throw new TypeError('fetch failed')
    }
    return portal.fetch(url, init)
  }
  const client = createBitrix24Client({ webhookUrl: WEBHOOK, fetch })
  await assert.rejects(client.deliver(lead()), AmbiguousDeliveryError)
  const patch = await attemptDelivery(
    { snapshot: lead(), attempts: 1, ambiguous: true },
    client,
    NOW,
  )
  assert.deepEqual([patch.state, patch.externalId], ['sent', '100'])
  assert.equal(portal.leads.length, 1)
})

test('проверка связи: права вебхука и пользователь, без ключа в ответе', async () => {
  const portal = fakePortal({
    scope: () => new Response(JSON.stringify({ result: ['crm', 'user'] })),
    profile: () =>
      new Response(
        JSON.stringify({ result: { NAME: 'Сергей', LAST_NAME: 'Пестриков', ADMIN: false } }),
      ),
  })
  const client = createBitrix24Client({ webhookUrl: WEBHOOK, fetch: portal.fetch })
  assert.deepEqual(await client.check(), {
    host: 'cadkz.bitrix24.kz',
    scopes: ['crm', 'user'],
    user: 'Сергей Пестриков',
    admin: false,
  })
  assert.equal(client.leadUrl('100'), 'https://cadkz.bitrix24.kz/crm/lead/details/100/')
})

test('поля лида портала: свои и обязательные поля с вариантами списков, источники', async () => {
  const portal = fakePortal({
    'crm.lead.fields': () =>
      new Response(
        JSON.stringify({
          result: {
            TITLE: { type: 'string', isRequired: false, title: 'Название' },
            UF_CRM_FORMNAME: { type: 'string', isRequired: false, formLabel: 'Форма' },
            UF_CRM_TOPIC: {
              type: 'enumeration',
              isRequired: false,
              listLabel: 'Тема обращения',
              items: [{ ID: '51', VALUE: 'Autodesk (Autocad)' }],
            },
          },
        }),
      ),
    'crm.status.list': () =>
      new Response(JSON.stringify({ result: [{ STATUS_ID: 'WEB', NAME: 'Веб-сайт' }] })),
  })
  const client = createBitrix24Client({ webhookUrl: WEBHOOK, fetch: portal.fetch })
  assert.deepEqual(await client.leadFields(), {
    fields: [
      'UF_CRM_FORMNAME — Форма (строка)',
      'UF_CRM_TOPIC — Тема обращения (список): 51 = Autodesk (Autocad)',
    ],
    sources: ['WEB = Веб-сайт'],
  })
})

test('название лида: товар корзины и «ещё N», заявка — тип и страница, номер в конце', () => {
  const items = lead().items
  assert.equal(
    toBitrix24Lead(lead({ items: [...items, { ...items[0], title: 'Artec Leo' }] })).params.fields
      .TITLE,
    'Заказ из корзины cad.kz: GEO5 Сваи и ещё 1 (CAD-20261020-ABCDE)',
  )
  assert.equal(
    toBitrix24Lead(lead({ kindLabel: 'Запрос цены', pageTitle: 'AutoCAD LT' })).params.fields.TITLE,
    'Запрос цены с сайта cad.kz: AutoCAD LT (CAD-20261020-ABCDE)',
  )
})

test('переписка — запись в ленте лида, при повторе не задваивается', async () => {
  const timeline = []
  const portal = fakePortal({
    'crm.timeline.comment.add': (params) => {
      timeline.push(params.fields)
      return new Response(JSON.stringify({ result: timeline.length }))
    },
    'crm.timeline.comment.list': () =>
      new Response(JSON.stringify({ result: timeline.map((row, i) => ({ ID: i, ...row })) })),
  })
  const client = createBitrix24Client({ webhookUrl: WEBHOOK, fetch: portal.fetch })
  const chat = lead({ messages: [{ role: 'user', content: 'Нужен AutoCAD' }] })
  await client.deliver(chat)
  await client.deliver(chat)
  assert.equal(timeline.length, 1)
  assert.deepEqual([timeline[0].ENTITY_TYPE, timeline[0].ENTITY_ID], ['lead', '100'])
  assert.match(timeline[0].COMMENT, /Нужен AutoCAD/)
})

test('название лида из чата: продукт, который собрал Кадди, без уточнений в скобках', () => {
  const fields = toBitrix24Lead(
    lead({
      kindLabel: 'Консультация',
      pageTitle: 'Чат с Кадди на сайте',
      summary: [
        { title: 'Продукт', value: 'АВС, продление лицензии (вариант и срок уточнит менеджер)' },
      ],
    }),
  ).params.fields
  assert.equal(
    fields.TITLE,
    'Консультация из чата с Кадди: АВС, продление лицензии (CAD-20261020-ABCDE)',
  )
})
