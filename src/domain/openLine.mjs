// Разговор с Кадди в открытой линии Битрикс24 (свой канал контакт-центра, методы imconnector.*).
// Здесь только сборка запросов и разбор событий, сеть — в src/lib/openLine/.
// Документация: https://apidocs.bitrix24.com/tutorials/openlines/example-connector

/** Код канала в контакт-центре. Только строчные латинские буквы, цифры и «_» (требование imconnector). */
export const CONNECTOR_ID = 'cadkz_site'

/** Название канала в контакт-центре. */
export const CONNECTOR_NAME = 'Сайт cad.kz — Кадди'

/** События, на которые подписывается приложение при установке. */
export const APP_EVENTS = [
  'OnImConnectorMessageAdd',
  'OnImConnectorLineDelete',
  'OnImConnectorStatusDelete',
  'OnAppUninstall',
]

const UNSAFE_KEYS = new Set(['__proto__', 'prototype', 'constructor'])
const MAX_DEPTH = 8

/**
 * Тело запроса Битрикс24 (application/x-www-form-urlencoded с ключами вида
 * `data[MESSAGES][0][im][chat_id]`) — вложенным объектом. Опасные ключи пропускаются.
 * @param {string} text
 * @returns {Record<string, any>}
 */
export function parseForm(text) {
  /** @type {Record<string, any>} */
  const root = {}
  for (const [key, value] of new URLSearchParams(text)) {
    const head = key.match(/^[^[]+/)?.[0]
    if (!head) continue
    const path = [head, ...[...key.slice(head.length).matchAll(/\[([^\]]*)\]/g)].map((m) => m[1])]
    if (path.length > MAX_DEPTH || path.some((part) => UNSAFE_KEYS.has(part))) continue
    let node = root
    for (const part of path.slice(0, -1)) {
      if (typeof node[part] !== 'object' || node[part] === null) node[part] = {}
      node = node[part]
    }
    node[path[path.length - 1]] = value
  }
  return root
}

/** Список из формы: `{0: …, 1: …}` или массив — массивом в порядке номеров. */
export function asList(value) {
  if (Array.isArray(value)) return value
  if (!value || typeof value !== 'object') return []
  return Object.keys(value)
    .filter((key) => /^\d+$/.test(key))
    .sort((a, b) => Number(a) - Number(b))
    .map((key) => value[key])
}

/** Сравнение секретов за одинаковое время. */
export function sameSecret(a, b) {
  const left = String(a ?? '')
  const right = String(b ?? '')
  if (!left || left.length !== right.length) return false
  let diff = 0
  for (let i = 0; i < left.length; i++) diff |= left.charCodeAt(i) ^ right.charCodeAt(i)
  return diff === 0
}

const ICON_SVG = (color) =>
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 70 70"><path fill="${color}" d="M14 16h42a6 6 0 0 1 6 6v22a6 6 0 0 1-6 6H32l-12 9v-9h-6a6 6 0 0 1-6-6V22a6 6 0 0 1 6-6z"/><path fill="#fff" d="M26 25h4v8l8-8h5l-9 9 10 11h-5l-9-10v10h-4z"/></svg>`

function icon(color) {
  return {
    DATA_IMAGE: `data:image/svg+xml;charset=US-ASCII,${encodeURIComponent(ICON_SVG(color))}`,
    COLOR: '#ffffff',
    SIZE: '90%',
    POSITION: 'center',
  }
}

/**
 * Регистрация канала (imconnector.register). Повторный вызов обновляет канал. Системные сообщения
 * линии и подпись оператора на сайт не нужны: имя менеджера сайт показывает сам. Правка и удаление
 * сообщений не поддерживаются — запрещаем их в канале.
 * @param {string} handlerUrl Адрес обработчика приложения: он же открывается в настройках канала.
 */
export function connectorRegistration(handlerUrl) {
  return {
    ID: CONNECTOR_ID,
    NAME: CONNECTOR_NAME,
    ICON: icon('#1d3557'),
    ICON_DISABLED: icon('#9aa5b1'),
    PLACEMENT_HANDLER: handlerUrl,
    DEL_EXTERNAL_MESSAGES: false,
    EDIT_INTERNAL_MESSAGES: false,
    DEL_INTERNAL_MESSAGES: false,
    NEWSLETTER: false,
    NEED_SYSTEM_MESSAGES: false,
    NEED_SIGNATURE: false,
    CHAT_GROUP: false,
  }
}

/** Данные канала для линии (imconnector.connector.data.set): без них канал не считается настроенным. */
export function connectorData(line, siteUrl) {
  return {
    CONNECTOR: CONNECTOR_ID,
    LINE: line,
    DATA: { ID: `${CONNECTOR_ID}_line_${line}`, URL_IM: siteUrl, NAME: 'Чат с Кадди на сайте' },
  }
}

/** Квадратные скобки из текста клиента — круглыми: иначе Битрикс24 прочтёт их как BB-код. */
function plainForBitrix(text) {
  return String(text).replaceAll('[', '(').replaceAll(']', ')')
}

/**
 * Ответ Кадди для оператора: **жирный** — в BB-код Битрикс24, [ссылки](адрес) — только подписью,
 * остальные квадратные скобки — круглыми. Ссылки не передаём: Битрикс24 разворачивает каждую в
 * большое превью, и ответ в линии растягивается на экран (замечание владельца 21.10.2026).
 */
export function kaddiText(text) {
  return plainForBitrix(
    String(text).replace(/\[([^\]\n]+)\]\((https?:\/\/[^\s)]+)\)/g, (_, label) => label),
  ).replace(/\*\*([^*\n]+)\*\*/g, '[b]$1[/b]')
}

/**
 * Реплика разговора текстом для линии. Клиент — как есть; Кадди — с пометкой, товарами под
 * ответом (название и цена, без ссылок) и кнопками быстрых ответов, чтобы менеджер видел то же,
 * что клиент. Адрес страницы, откуда пишет клиент, Битрикс24 показывает в данных чата.
 * @param {{ role: string, content: string, cards?: { title: string, href: string, price?: string | null }[], replies?: string[] }} message
 */
export function lineText(message) {
  if (message.role === 'user') return plainForBitrix(message.content)
  const parts = [`[b]Кадди (ИИ):[/b] ${kaddiText(message.content)}`]
  if (message.cards?.length)
    parts.push(
      `[i]Товары под ответом:[/i] ${message.cards
        .map((card) => {
          const price = card.price ? ` — ${plainForBitrix(card.price)}` : ''
          return `${plainForBitrix(card.title)}${price}`
        })
        .join('; ')}`,
    )
  if (message.replies?.length)
    parts.push(`[i]Кнопки ответа:[/i] ${message.replies.map(plainForBitrix).join(' | ')}`)
  return parts.join('\n')
}

/** Имя клиента для линии: Битрикс24 принимает буквы, пробел, дефис и апостроф, до 25 знаков. */
export function visitorName(name) {
  const clean = String(name ?? '')
    .replace(/[^\p{L}\s'-]/gu, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 25)
    .trim()
  return clean || 'Посетитель сайта'
}

/**
 * Сообщения разговора, ещё не отправленные в линию (imconnector.send.messages). Реплики менеджера
 * пришли из линии — их не отправляем. Номер сообщения в разговоре — его ID для Битрикс24.
 * @param {{
 *   chatId: string,
 *   messages: { role: string, content: string, at: string, cards?: any[], replies?: string[] }[],
 *   from: number,
 *   siteUrl: string,
 *   pageUrl?: string,
 *   name?: string,
 * }} input
 */
export function lineMessages(input) {
  const user = { id: input.chatId, name: visitorName(input.name) }
  const chat = {
    id: input.chatId,
    name: 'Чат с Кадди на сайте',
    url: input.pageUrl || input.siteUrl,
  }
  return input.messages
    .map((message, index) => ({ message, index }))
    .slice(input.from)
    .filter(({ message }) => message.role === 'user' || message.role === 'assistant')
    .filter(({ message }) => message.content.trim())
    .map(({ message, index }) => {
      const at = Date.parse(message.at)
      return {
        user,
        message: {
          id: String(index),
          date: Math.floor((Number.isFinite(at) ? at : Date.now()) / 1000),
          text: lineText(message),
        },
        chat,
      }
    })
}

/**
 * Итог imconnector.send.messages: дошли ли все сообщения и номер чата линии в Битрикс24.
 * @returns {{ ok: boolean, chatId: number | null, sessionId: number | null, error: string }}
 */
export function readSendResult(result) {
  const rows = asList(result?.DATA?.RESULT)
  const failed = rows.find((row) => row && row.SUCCESS === false)
  const session = rows.find((row) => row?.session)?.session
  const errors = failed ? asList(failed.ERRORS).map(String).join('; ') : ''
  return {
    ok: result?.SUCCESS !== false && !failed,
    chatId: Number(session?.CHAT_ID) || null,
    sessionId: Number(session?.ID) || null,
    error: failed ? errors || 'Битрикс24 не принял сообщение' : '',
  }
}

/** BB-коды сообщения оператора — простым текстом для окна чата на сайте. */
export function operatorText(text) {
  return String(text ?? '')
    .replace(/\[br\]/gi, '\n')
    .replace(/\[url=([^\]]+)\](.*?)\[\/url\]/gi, (_, url, label) =>
      label && label !== url ? `${label} (${url})` : url,
    )
    .replace(/\[url\](.*?)\[\/url\]/gi, '$1')
    .replace(/\[(\w+)=[^\]]*\](.*?)\[\/\1\]/gis, '$2')
    .replace(/\[\/?(b|i|u|s|quote|code|left|right|center|justify|size|color|font|p)\]/gi, '')
    .replace(/[ \t]+\n/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim()
}

/**
 * Сообщения оператора из события OnImConnectorMessageAdd. Чужой канал или без номеров — пропуск.
 * userId — кто написал (0 — система: автоответы линии, они не значат, что вступил менеджер).
 * @param {Record<string, any>} data `data` события.
 */
export function readOperatorMessages(data) {
  if (String(data?.CONNECTOR ?? '').toLowerCase() !== CONNECTOR_ID) return []
  const line = Number(data?.LINE) || 0
  return asList(data?.MESSAGES).flatMap((item) => {
    const chatId = String(item?.chat?.id ?? '')
    const imChatId = Number(item?.im?.chat_id) || 0
    const imMessageId = Number(item?.im?.message_id) || 0
    if (!chatId || !imMessageId) return []
    const files = asList(item?.message?.files)
      .map((file) => {
        const name = String(file?.name ?? 'файл')
        const link = String(file?.link ?? file?.url ?? '')
        return link.startsWith('https://') ? `${name}: ${link}` : ''
      })
      .filter(Boolean)
    const text = [operatorText(item?.message?.text), ...files].filter(Boolean).join('\n')
    return [
      {
        line,
        chatId,
        imChatId,
        imMessageId,
        userId: Number(item?.message?.user_id) || 0,
        text,
      },
    ]
  })
}

/**
 * Подтверждение, что сообщения оператора дошли до клиента (imconnector.send.status.delivery):
 * без него у оператора сообщение висит недоставленным.
 * @param {number} line
 * @param {{ chatId: string, imChatId: number, imMessageId: number }[]} items
 * @param {Date} now
 */
export function deliveryParams(line, items, now = new Date()) {
  return {
    CONNECTOR: CONNECTOR_ID,
    LINE: line,
    MESSAGES: items.map((item) => ({
      im: { chat_id: item.imChatId, message_id: item.imMessageId },
      message: { id: [`op${item.imMessageId}`], date: Math.floor(now.getTime() / 1000) },
      chat: { id: item.chatId },
    })),
  }
}

/** Настройки канала из PLACEMENT_OPTIONS (JSON строкой): номер линии и включён ли канал. */
export function readPlacement(options) {
  let value = options
  if (typeof options === 'string') {
    try {
      value = JSON.parse(options)
    } catch {
      return null
    }
  }
  const line = Number(value?.LINE)
  if (!Number.isInteger(line) || line <= 0) return null
  const flag = (v) => v === true || v === 'Y' || v === 'true' || v === 1 || v === '1'
  return { line, active: flag(value?.ACTIVE_STATUS), connector: String(value?.CONNECTOR ?? '') }
}

function escapeHtml(text) {
  return String(text)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
}

/**
 * Страница приложения внутри Битрикс24 (установка, настройки канала): заголовок и строки
 * состояния. finish — завершить установку (BX24.installFinish), иначе приложение останется
 * «не установленным».
 * @param {{ title: string, lines: string[], ok: boolean, finish?: boolean }} page
 */
export function appPage(page) {
  const script = page.finish
    ? '<script src="https://api.bitrix24.com/api/v1/"></script><script>BX24.init(function(){BX24.installFinish()})</script>'
    : ''
  const color = page.ok ? '#1b7f4b' : '#b42318'
  return `<!doctype html><html lang="ru"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${escapeHtml(page.title)}</title><style>body{margin:0;padding:24px;font:15px/1.5 -apple-system,"Segoe UI",Roboto,Arial,sans-serif;color:#1f2933;background:#fff}h1{margin:0 0 12px;font-size:18px;color:${color}}p{margin:0 0 8px;max-width:640px}</style>${script}</head><body><h1>${escapeHtml(page.title)}</h1>${page.lines.map((line) => `<p>${escapeHtml(line)}</p>`).join('')}</body></html>`
}
