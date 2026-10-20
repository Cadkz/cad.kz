import config from '@payload-config'
import { after } from 'next/server'
import { getPayload } from 'payload'
import { conversationKey, validateChat } from '@/domain/assistant.mjs'
import { createRateLimiter } from '@/domain/rateLimit.mjs'
import { findConversation } from '@/lib/assistant/conversation'
import { assistantMode } from '@/lib/assistant/provider'
import { askAssistant, managerMessages } from '@/lib/assistant/service'
import { clientHash } from '@/lib/checkout'
import { mirrorToLine, openLineOn } from '@/lib/openLine/mirror'

const MAX_BODY = 4000
const globalStore = globalThis as {
  __assistantLimiter?: ReturnType<typeof createRateLimiter>
  __assistantPollLimiter?: ReturnType<typeof createRateLimiter>
}
globalStore.__assistantLimiter ??= createRateLimiter({ limit: 10, windowMs: 60_000 })
// Окно чата спрашивает ответы менеджера раз в 5 секунд (12 в минуту): запас на две вкладки.
globalStore.__assistantPollLimiter ??= createRateLimiter({ limit: 40, windowMs: 60_000 })
const limiter = globalStore.__assistantLimiter
const pollLimiter = globalStore.__assistantPollLimiter

/** Ответ модели может идти до 30 с, после ответа — отправка в открытую линию: даём запас. */
export const maxDuration = 60

const STATUS = { ok: 200, forwarded: 200, limit: 429, busy: 409, failed: 503 } as const

function reply(body: Record<string, unknown>, status: number) {
  return Response.json(body, { status, headers: { 'Cache-Control': 'no-store' } })
}

/** Страница, с которой пишет клиент (для менеджера в открытой линии), — только адреса этого сайта. */
function pageUrl(request: Request, origin: string) {
  const referer = request.headers.get('referer')
  try {
    return referer && new URL(referer).origin === origin ? referer : undefined
  } catch {
    return undefined
  }
}

/**
 * ИИ-консультант Кадди: новое сообщение клиента → ответ и ссылки на товары. История — на сервере
 * (src/lib/assistant/conversation.ts). Консультант выключен — 404, кнопки на сайте тоже нет.
 * Открытая линия подключена — после ответа вопрос и ответ уходят в Битрикс24 (src/lib/openLine/).
 */
export async function POST(request: Request) {
  const mode = assistantMode()
  if (!mode) return reply({ status: 'unavailable', error: 'Консультант не подключён' }, 404)
  if (!request.headers.get('content-type')?.startsWith('application/json'))
    return reply({ status: 'bad_request', error: 'Некорректный запрос' }, 415)
  const hash = clientHash(request)
  if (hash && !limiter.check(hash).allowed)
    return reply(
      { status: 'rate_limited', error: 'Слишком много вопросов подряд. Подождите минуту.' },
      429,
    )
  const text = await request.text()
  if (text.length > MAX_BODY)
    return reply({ status: 'bad_request', error: 'Слишком длинное сообщение' }, 413)
  let body: unknown
  try {
    body = JSON.parse(text)
  } catch {
    return reply({ status: 'bad_request', error: 'Некорректный запрос' }, 400)
  }
  const checked = validateChat(body)
  if (!checked.ok) return reply({ status: 'invalid', error: checked.error }, 422)

  const payload = await getPayload({ config })
  const live = await openLineOn(payload)
  const answer = await askAssistant(payload, mode, checked.value, hash, live)
  if (live && answer.status !== 'busy' && answer.status !== 'limit') {
    const origin = new URL(request.url).origin
    const page = { siteUrl: origin, pageUrl: pageUrl(request, origin) }
    after(() => mirrorToLine(payload, checked.value.conversationId, page))
  }
  return reply(answer, STATUS[answer.status])
}

/**
 * Новые ответы менеджера из открытой линии: окно чата спрашивает раз в несколько секунд, пока
 * разговор идёт в линию. managers — сколько ответов менеджера окно уже показало.
 */
export async function GET(request: Request) {
  if (!assistantMode()) return reply({ status: 'unavailable' }, 404)
  const url = new URL(request.url)
  const key = conversationKey(url.searchParams.get('conversationId'))
  if (!key) return reply({ status: 'invalid' }, 422)
  const hash = clientHash(request)
  if (hash && !pollLimiter.check(hash).allowed) return reply({ status: 'rate_limited' }, 429)
  const known = Math.min(
    Math.max(Number.parseInt(url.searchParams.get('managers') ?? '', 10) || 0, 0),
    500,
  )
  const payload = await getPayload({ config })
  const [live, stored] = await Promise.all([openLineOn(payload), findConversation(payload, key)])
  return reply({ status: 'ok', live, messages: managerMessages(stored, known) }, 200)
}
