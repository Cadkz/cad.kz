// Приложение Битрикс24 (локальное серверное): вызовы REST от имени приложения по OAuth.
// Каналы открытых линий (imconnector.*) работают только так, входящий вебхук их не вызовет.
// Сеть и хранение токенов подаются снаружи: логику можно проверить без портала.
// Токены — секрет: в ошибки и журнал они не попадают.

const OAUTH_URL = 'https://oauth.bitrix.info/oauth/token/'
const TIMEOUT_MS = 10_000
/** Обновляем токен заранее, за минуту до конца срока. */
const EARLY_MS = 60_000

export class Bitrix24AppError extends Error {
  constructor(method, code, description = '') {
    super(`Битрикс24, ${method}: ${code}${description ? ` — ${description}` : ''}`)
    this.code = code
  }
}

function clean(text) {
  return String(text ?? '')
    .replace(/https?:\/\/\S+/g, '[адрес]')
    .replace(/[a-f0-9]{24,}/gi, '[ключ]')
    .slice(0, 200)
}

/**
 * Адрес REST портала из ответа OAuth: только https и путь /rest/. Возвращает адрес со слешем на
 * конце и домен портала.
 */
export function parseClientEndpoint(value) {
  let url
  try {
    url = new URL(String(value ?? ''))
  } catch {
    return null
  }
  if (url.protocol !== 'https:' || !/^\/rest\/?$/.test(url.pathname)) return null
  return { endpoint: `${url.origin}/rest/`, domain: url.host }
}

/**
 * Токены из ответа oauth.bitrix.info (обновление) в том виде, как их хранит сайт.
 * @param {Record<string, any>} body
 * @param {number} now
 */
export function readOAuth(body, now) {
  const endpoint = parseClientEndpoint(body?.client_endpoint)
  if (!body?.access_token || !body?.refresh_token || !endpoint) return null
  const expiresIn = Number(body.expires_in) || 3600
  return {
    accessToken: String(body.access_token),
    refreshToken: String(body.refresh_token),
    expiresAt: now + expiresIn * 1000,
    clientEndpoint: endpoint.endpoint,
    domain: endpoint.domain,
    memberId: String(body.member_id ?? ''),
  }
}

/**
 * Обновление токена у сервера авторизации Битрикс24. Заодно проверка подлинности: ключ приложения
 * знает только сайт, поэтому чужой или поддельный токен здесь не пройдёт.
 * @param {{ fetch: typeof globalThis.fetch, clientId: string, clientSecret: string }} app
 * @param {string} refreshToken
 * @param {number} [now]
 */
export async function refreshTokens(app, refreshToken, now = Date.now()) {
  const url = new URL(OAUTH_URL)
  url.search = new URLSearchParams({
    grant_type: 'refresh_token',
    client_id: app.clientId,
    client_secret: app.clientSecret,
    refresh_token: refreshToken,
  }).toString()
  let response
  try {
    response = await app.fetch(url, { signal: AbortSignal.timeout(TIMEOUT_MS) })
  } catch {
    throw new Bitrix24AppError('oauth', 'NETWORK', 'нет связи с сервером авторизации')
  }
  let body
  try {
    body = await response.json()
  } catch {
    throw new Bitrix24AppError('oauth', `HTTP_${response.status}`, 'ответ не в формате JSON')
  }
  if (body?.error)
    throw new Bitrix24AppError('oauth', String(body.error), clean(body.error_description))
  const tokens = readOAuth(body, now)
  if (!tokens) throw new Bitrix24AppError('oauth', 'BAD_RESPONSE', 'в ответе нет токенов')
  return tokens
}

/**
 * Клиент REST от имени приложения. Токен истёк — обновляет и повторяет вызов один раз; новые
 * токены отдаёт в onTokens (их нужно сохранить: старый ключ обновления больше не работает).
 * @param {{
 *   fetch: typeof globalThis.fetch,
 *   clientId: string,
 *   clientSecret: string,
 *   tokens: { accessToken: string, refreshToken: string, expiresAt: number, clientEndpoint: string },
 *   onTokens: (tokens: ReturnType<typeof readOAuth>) => Promise<void>,
 *   now?: () => number,
 * }} options
 */
export function createAppClient(options) {
  const now = options.now ?? Date.now
  let tokens = options.tokens

  async function renew() {
    const fresh = await refreshTokens(options, tokens.refreshToken, now())
    if (!fresh) return
    tokens = fresh
    await options.onTokens(fresh)
  }

  async function request(method, params) {
    let response
    try {
      response = await options.fetch(`${tokens.clientEndpoint}${method}.json`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify({ ...params, auth: tokens.accessToken }),
        signal: AbortSignal.timeout(TIMEOUT_MS),
      })
    } catch (error) {
      const reason =
        error instanceof Error && error.name === 'TimeoutError' ? 'нет ответа' : 'обрыв связи'
      throw new Bitrix24AppError(method, 'NETWORK', reason)
    }
    let body
    try {
      body = await response.json()
    } catch {
      throw new Bitrix24AppError(method, `HTTP_${response.status}`, 'ответ не в формате JSON')
    }
    return body
  }

  /**
   * Один вызов метода.
   * @param {string} method
   * @param {Record<string, unknown>} [params]
   */
  async function call(method, params = {}) {
    if (tokens.expiresAt - EARLY_MS <= now()) await renew()
    let body = await request(method, params)
    if (body?.error === 'expired_token' || body?.error === 'invalid_token') {
      await renew()
      body = await request(method, params)
    }
    if (body?.error)
      throw new Bitrix24AppError(method, String(body.error), clean(body.error_description))
    return body?.result
  }

  return { call }
}
