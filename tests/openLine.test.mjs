import assert from 'node:assert/strict'
import test from 'node:test'
import { modelHistory } from '../src/domain/assistant.mjs'
import { dialogText } from '../src/domain/bitrix24.mjs'
import {
  Bitrix24AppError,
  createAppClient,
  parseClientEndpoint,
  refreshTokens,
} from '../src/domain/bitrix24App.mjs'
import {
  appPage,
  asList,
  CONNECTOR_ID,
  connectorRegistration,
  deliveryParams,
  kaddiText,
  lineMessages,
  operatorText,
  parseForm,
  readOperatorMessages,
  readPlacement,
  readSendResult,
  sameSecret,
  visitorName,
} from '../src/domain/openLine.mjs'

const CHAT = '3f1c2a4e-1b2c-4d5e-8f90-123456789abc'
const SITE = 'https://cad-kz.vercel.app'

test('форма Битрикс24 разбирается во вложенный объект, опасные ключи пропускаются', () => {
  const body = new URLSearchParams({
    event: 'ONIMCONNECTORMESSAGEADD',
    'data[CONNECTOR]': 'cadkz_site',
    'data[MESSAGES][0][im][chat_id]': '1767',
    'data[MESSAGES][0][message][text]': 'Здравствуйте',
    'data[MESSAGES][1][im][chat_id]': '1768',
    'auth[application_token]': 'abc',
    '__proto__[polluted]': 'yes',
    'data[__proto__][x]': 'yes',
  }).toString()
  const parsed = parseForm(body)
  assert.equal(parsed.event, 'ONIMCONNECTORMESSAGEADD')
  assert.equal(parsed.data.MESSAGES[0].im.chat_id, '1767')
  assert.equal(asList(parsed.data.MESSAGES).length, 2)
  assert.equal(parsed.auth.application_token, 'abc')
  assert.equal({}.polluted, undefined)
  assert.equal(Object.hasOwn(parsed.data, '__proto__'), false)
})

test('сравнение секретов', () => {
  assert.equal(sameSecret('abc', 'abc'), true)
  assert.equal(sameSecret('abc', 'abd'), false)
  assert.equal(sameSecret('', ''), false)
  assert.equal(sameSecret(undefined, 'abc'), false)
})

test('регистрация канала: код без точки, обработчик, без системных сообщений и правок', () => {
  const params = connectorRegistration(`${SITE}/api/bitrix24/app`)
  assert.equal(params.ID, CONNECTOR_ID)
  assert.match(params.ID, /^[a-z0-9_]+$/)
  assert.equal(params.PLACEMENT_HANDLER, `${SITE}/api/bitrix24/app`)
  assert.match(params.ICON.DATA_IMAGE, /^data:image\/svg\+xml;charset=US-ASCII,%3Csvg/)
  assert.equal(params.NEED_SYSTEM_MESSAGES, false)
  assert.equal(params.EDIT_INTERNAL_MESSAGES, false)
})

test('ответ Кадди для оператора: жирный и ссылки — BB-кодами, лишние скобки — круглыми', () => {
  assert.equal(
    kaddiText('**AutoCAD LT** на год — [карточка](https://cad.kz/autocad) [скидка]'),
    '[b]AutoCAD LT[/b] на год — [url=https://cad.kz/autocad]карточка[/url] (скидка)',
  )
})

test('разговор в линию: клиент как есть, Кадди с пометкой, карточками и кнопками; менеджер не уходит', () => {
  const messages = [
    { role: 'user', content: 'Нужен [автокад]', at: '2026-10-20T10:00:00.000Z' },
    {
      role: 'assistant',
      content: 'Подойдёт **AutoCAD LT**. Новая или продление?',
      at: '2026-10-20T10:00:05.000Z',
      cards: [
        {
          id: 1,
          title: 'AutoCAD LT',
          href: '/catalog/autocad-lt',
          vendor: null,
          price: 'от 313 621 ₸',
        },
      ],
      replies: ['Новая', 'Продление'],
    },
    { role: 'manager', content: 'Добрый день!', at: '2026-10-20T10:01:00.000Z', name: 'Айгерим' },
    { role: 'user', content: 'Новая', at: '2026-10-20T10:02:00.000Z' },
  ]
  const all = lineMessages({ chatId: CHAT, messages, from: 0, siteUrl: SITE })
  assert.equal(all.length, 3)
  assert.equal(all[0].message.text, 'Нужен (автокад)')
  assert.equal(all[0].message.id, '0')
  assert.equal(all[0].message.date, Date.parse('2026-10-20T10:00:00.000Z') / 1000)
  assert.equal(all[0].user.id, CHAT)
  assert.equal(all[0].chat.id, CHAT)
  assert.equal(all[0].user.name, 'Посетитель сайта')
  const kaddi = all[1].message.text
  assert.match(kaddi, /^\[b\]Кадди \(ИИ\):\[\/b\] Подойдёт \[b\]AutoCAD LT\[\/b\]/)
  assert.match(
    kaddi,
    /\[url=https:\/\/cad-kz\.vercel\.app\/catalog\/autocad-lt\]AutoCAD LT\[\/url\] — от 313 621 ₸/,
  )
  assert.match(kaddi, /Кнопки ответа:\[\/i\] Новая \| Продление/)
  assert.equal(all[2].message.id, '3')
  // Уже отправленные не повторяются.
  const rest = lineMessages({ chatId: CHAT, messages, from: 2, siteUrl: SITE, name: 'Алия (ТОО)' })
  assert.deepEqual(
    rest.map((m) => m.message.id),
    ['3'],
  )
  assert.equal(rest[0].user.name, 'Алия ТОО')
})

test('имя клиента для линии: только буквы, до 25 знаков', () => {
  assert.equal(visitorName(''), 'Посетитель сайта')
  assert.equal(visitorName('Иван 2'), 'Иван')
  assert.equal(visitorName('Константин Константинопольский').length <= 25, true)
})

test('итог отправки в линию: номер чата и ошибка', () => {
  const ok = readSendResult({
    SUCCESS: true,
    DATA: { RESULT: [{ SUCCESS: true, session: { ID: '323', CHAT_ID: '1767' } }] },
  })
  assert.deepEqual(ok, { ok: true, chatId: 1767, sessionId: 323, error: '' })
  const bad = readSendResult({
    SUCCESS: true,
    DATA: { RESULT: [{ SUCCESS: false, ERRORS: ['Нет линии'] }] },
  })
  assert.equal(bad.ok, false)
  assert.equal(bad.error, 'Нет линии')
})

test('сообщение оператора: BB-коды убраны, ссылки и файлы текстом, системные с user_id 0', () => {
  assert.equal(
    operatorText(
      '[b]Здравствуйте![/b][br]Смотрите [url=https://cad.kz/x]тут[/url], [user=5]Иван[/user]',
    ),
    'Здравствуйте!\nСмотрите тут (https://cad.kz/x), Иван',
  )
  const data = parseForm(
    new URLSearchParams({
      'data[CONNECTOR]': 'cadkz_site',
      'data[LINE]': '3',
      'data[MESSAGES][0][im][chat_id]': '1767',
      'data[MESSAGES][0][im][message_id]': '9001',
      'data[MESSAGES][0][message][user_id]': '12',
      'data[MESSAGES][0][message][text]': 'Добрый день',
      'data[MESSAGES][0][chat][id]': CHAT,
      'data[MESSAGES][1][im][chat_id]': '1767',
      'data[MESSAGES][1][im][message_id]': '9002',
      'data[MESSAGES][1][message][user_id]': '0',
      'data[MESSAGES][1][message][text]': 'Оцените работу оператора',
      'data[MESSAGES][1][chat][id]': CHAT,
    }).toString(),
  ).data
  const messages = readOperatorMessages(data)
  assert.equal(messages.length, 2)
  assert.deepEqual(messages[0], {
    line: 3,
    chatId: CHAT,
    imChatId: 1767,
    imMessageId: 9001,
    userId: 12,
    text: 'Добрый день',
  })
  assert.equal(messages[1].userId, 0)
  // Чужой канал — пусто.
  assert.deepEqual(readOperatorMessages({ ...data, CONNECTOR: 'other' }), [])
})

test('подтверждение доставки оператору', () => {
  const params = deliveryParams(
    3,
    [{ chatId: CHAT, imChatId: 1767, imMessageId: 9001 }],
    new Date(1_760_000_000_000),
  )
  assert.deepEqual(params, {
    CONNECTOR: CONNECTOR_ID,
    LINE: 3,
    MESSAGES: [
      {
        im: { chat_id: 1767, message_id: 9001 },
        message: { id: ['op9001'], date: 1_760_000_000 },
        chat: { id: CHAT },
      },
    ],
  })
})

test('настройки канала: линия из PLACEMENT_OPTIONS строкой', () => {
  assert.deepEqual(readPlacement('{"CONNECTOR":"cadkz_site","LINE":"3","ACTIVE_STATUS":false}'), {
    line: 3,
    active: false,
    connector: 'cadkz_site',
  })
  assert.equal(readPlacement('{"LINE":"0"}'), null)
  assert.equal(readPlacement('не json'), null)
})

test('страница приложения экранирует текст и завершает установку только по просьбе', () => {
  const page = appPage({ title: 'Ошибка <b>', lines: ['a & b'], ok: false })
  assert.match(page, /Ошибка &lt;b&gt;/)
  assert.match(page, /a &amp; b/)
  assert.doesNotMatch(page, /installFinish/)
  assert.match(appPage({ title: 'ok', lines: [], ok: true, finish: true }), /BX24\.installFinish/)
})

test('модель не видит реплик менеджера, лид подписывает их', () => {
  const history = modelHistory([
    { role: 'user', content: 'Вопрос', at: '' },
    { role: 'assistant', content: 'Ответ', at: '' },
    { role: 'manager', content: 'Я менеджер', at: '', name: 'Айгерим' },
  ])
  assert.deepEqual(history, [
    { role: 'user', content: 'Вопрос' },
    { role: 'assistant', content: 'Ответ' },
  ])
  const text = dialogText({
    messages: [
      { role: 'user', content: 'Вопрос' },
      { role: 'manager', content: 'Здравствуйте', name: 'Айгерим' },
    ],
  })
  assert.match(text, /\[b\]Менеджер Айгерим:\[\/b\] Здравствуйте/)
})

const OAUTH_OK = {
  access_token: 'access-new',
  refresh_token: 'refresh-new',
  expires_in: 3600,
  client_endpoint: 'https://orient.bitrix24.kz/rest/',
  member_id: 'member-1',
}

function jsonResponse(body, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  })
}

test('адрес REST портала только https и /rest/', () => {
  assert.deepEqual(parseClientEndpoint('https://orient.bitrix24.kz/rest/'), {
    endpoint: 'https://orient.bitrix24.kz/rest/',
    domain: 'orient.bitrix24.kz',
  })
  assert.equal(parseClientEndpoint('http://orient.bitrix24.kz/rest/'), null)
  assert.equal(parseClientEndpoint('https://evil.example/other'), null)
})

test('обновление токена: ключи приложения уходят на oauth.bitrix.info, ошибка без секретов', async () => {
  const calls = []
  const app = {
    clientId: 'local.abc',
    clientSecret: 'secret',
    fetch: async (url) => {
      calls.push(String(url))
      return jsonResponse(OAUTH_OK)
    },
  }
  const tokens = await refreshTokens(app, 'refresh-old', 1_000)
  assert.equal(new URL(calls[0]).host, 'oauth.bitrix.info')
  assert.equal(new URL(calls[0]).searchParams.get('refresh_token'), 'refresh-old')
  assert.equal(tokens.domain, 'orient.bitrix24.kz')
  assert.equal(tokens.expiresAt, 1_000 + 3_600_000)
  const failing = {
    ...app,
    fetch: async () => jsonResponse({ error: 'invalid_grant', error_description: 'bad' }, 400),
  }
  await assert.rejects(refreshTokens(failing, 'x'), (error) => {
    assert.ok(error instanceof Bitrix24AppError)
    assert.equal(error.code, 'invalid_grant')
    return true
  })
})

test('клиент приложения: истёкший токен обновляется, вызов повторяется, новые токены сохраняются', async () => {
  const saved = []
  const seen = []
  const fetch = async (url, init) => {
    if (String(url).startsWith('https://oauth.bitrix.info')) return jsonResponse(OAUTH_OK)
    const body = JSON.parse(init.body)
    seen.push(body.auth)
    if (body.auth === 'access-old') return jsonResponse({ error: 'expired_token' }, 401)
    return jsonResponse({ result: { ok: true } })
  }
  const client = createAppClient({
    fetch,
    clientId: 'local.abc',
    clientSecret: 'secret',
    tokens: {
      accessToken: 'access-old',
      refreshToken: 'refresh-old',
      expiresAt: Date.now() + 3_600_000,
      clientEndpoint: 'https://orient.bitrix24.kz/rest/',
    },
    onTokens: async (tokens) => {
      saved.push(tokens)
    },
  })
  assert.deepEqual(await client.call('imconnector.status', { CONNECTOR: CONNECTOR_ID }), {
    ok: true,
  })
  assert.deepEqual(seen, ['access-old', 'access-new'])
  assert.equal(saved[0].refreshToken, 'refresh-new')
  await assert.rejects(
    createAppClient({
      fetch: async () => jsonResponse({ error: 'ACCESS_DENIED', error_description: 'нет прав' }),
      clientId: 'a',
      clientSecret: 'b',
      tokens: {
        accessToken: 't',
        refreshToken: 'r',
        expiresAt: Date.now() + 3_600_000,
        clientEndpoint: 'https://p.bitrix24.kz/rest/',
      },
      onTokens: async () => {},
    }).call('imconnector.register'),
    /ACCESS_DENIED/,
  )
})
