// Передача заявок в Битрикс24 через входящий вебхук. Сеть подаётся снаружи (fetch), чтобы логику
// можно было проверить без портала. Адрес вебхука — секрет: в ошибки и журнал он не попадает.

import { findLeadQuery, pickFoundLead, toBitrix24Lead, toBitrix24Rows } from './bitrix24.mjs'
import { AmbiguousDeliveryError } from './outbox.mjs'

const TIMEOUT_MS = 10_000

/** Ошибка, которую вернул сам Битрикс24: запрос дошёл и точно не выполнен. */
export class Bitrix24Error extends Error {
  constructor(method, code, description) {
    super(`Битрикс24, ${method}: ${code}${description ? ` — ${description}` : ''}`)
    this.code = code
  }
}

/**
 * Проверяет адрес вебхука: https, путь /rest/<пользователь>/<ключ>/. Возвращает базовый адрес
 * со слешем на конце и домен портала (домен не секрет, его можно показывать).
 * @param {string | undefined} value
 */
export function parseWebhookUrl(value) {
  const text = (value ?? '').trim()
  if (!text) return null
  let url
  try {
    url = new URL(text)
  } catch {
    return null
  }
  const match = url.pathname.match(/^\/rest\/(\d+)\/([A-Za-z0-9]+)\/?/)
  if (url.protocol !== 'https:' || !match) return null
  return { base: `${url.origin}/rest/${match[1]}/${match[2]}/`, host: url.host, userId: match[1] }
}

/** Короткое описание ошибки без адреса вебхука. */
function cleanDescription(text) {
  return String(text ?? '')
    .replace(/https?:\/\/\S+/g, '[адрес]')
    .slice(0, 200)
}

/**
 * @param {{
 *   webhookUrl: string,
 *   fetch: typeof globalThis.fetch,
 *   test?: boolean,
 *   responsibleId?: string,
 *   timeoutMs?: number,
 * }} options
 */
export function createBitrix24Client(options) {
  const parsed = parseWebhookUrl(options.webhookUrl)
  if (!parsed)
    throw new Error('Адрес вебхука Битрикс24 не похож на https://<портал>/rest/<id>/<ключ>/')
  const timeoutMs = options.timeoutMs ?? TIMEOUT_MS

  /**
   * Один вызов метода. Сбой связи (таймаут, обрыв) — неясный итог: запрос мог выполниться.
   * @param {string} method
   * @param {object} params
   */
  async function call(method, params = {}) {
    let response
    try {
      response = await options.fetch(`${parsed.base}${method}.json`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify(params),
        signal: AbortSignal.timeout(timeoutMs),
      })
    } catch (error) {
      const reason =
        error instanceof Error && error.name === 'TimeoutError' ? 'нет ответа' : 'обрыв связи'
      throw new AmbiguousDeliveryError(`Битрикс24, ${method}: ${reason}`)
    }
    let body
    try {
      body = await response.json()
    } catch {
      if (response.status >= 500)
        throw new AmbiguousDeliveryError(`Битрикс24, ${method}: ответ ${response.status}`)
      throw new Bitrix24Error(method, `HTTP_${response.status}`, 'ответ не в формате JSON')
    }
    if (body && typeof body === 'object' && 'error' in body)
      throw new Bitrix24Error(method, String(body.error), cleanDescription(body.error_description))
    if (!response.ok) throw new Bitrix24Error(method, `HTTP_${response.status}`, '')
    return body?.result
  }

  /** Лид с этим ключом уже есть? Возвращает его ID. */
  async function find(idempotencyKey) {
    const result = await call('crm.lead.list', findLeadQuery(idempotencyKey))
    const id = pickFoundLead(result, idempotencyKey)
    return id ? { externalId: id } : null
  }

  /**
   * Лид с товарами. Сначала ищем лид по ключу: если прошлая попытка создала его, но ответ не
   * дошёл, второй не создаётся. Строки товаров задаются целиком, повтор их не удваивает.
   */
  async function deliver(lead) {
    const existing = await find(lead.idempotencyKey)
    let id = existing?.externalId
    if (!id) {
      const { method, params } = toBitrix24Lead(lead, {
        test: options.test,
        responsibleId: options.responsibleId,
      })
      const created = await call(method, params)
      if (!created) throw new Bitrix24Error(method, 'NO_ID', 'Битрикс24 не вернул номер лида')
      id = String(created)
    }
    const rows = toBitrix24Rows(lead)
    if (rows.length) await call('crm.lead.productrows.set', { id, rows })
    return { status: /** @type {const} */ ('sent'), externalId: id }
  }

  /** Ссылка на лид в портале для админки. */
  function leadUrl(id) {
    return `https://${parsed.host}/crm/lead/details/${id}/`
  }

  /** Что умеет вебхук: права и от чьего имени работает. Для страницы проверки в админке. */
  async function check() {
    const scopes = await call('scope')
    const profile = await call('profile')
    const name = [profile?.NAME, profile?.LAST_NAME].filter(Boolean).join(' ')
    return {
      host: parsed.host,
      scopes: Array.isArray(scopes) ? scopes.map(String) : [],
      user: name || `ID ${parsed.userId}`,
      admin: Boolean(profile?.ADMIN),
    }
  }

  return { call, find, deliver, leadUrl, check, host: parsed.host }
}
