import config from '@payload-config'
import { getPayload } from 'payload'
import { validateChat } from '@/domain/assistant.mjs'
import { createRateLimiter } from '@/domain/rateLimit.mjs'
import { assistantMode } from '@/lib/assistant/provider'
import { askAssistant } from '@/lib/assistant/service'
import { clientHash } from '@/lib/checkout'

const MAX_BODY = 4000
const globalStore = globalThis as { __assistantLimiter?: ReturnType<typeof createRateLimiter> }
globalStore.__assistantLimiter ??= createRateLimiter({ limit: 10, windowMs: 60_000 })
const limiter = globalStore.__assistantLimiter

/** Ответ модели может идти до 30 с: даём функции хостинга запас. */
export const maxDuration = 45

function reply(body: Record<string, unknown>, status: number) {
  return Response.json(body, { status, headers: { 'Cache-Control': 'no-store' } })
}

/**
 * ИИ-консультант Кади: новое сообщение клиента → ответ и ссылки на товары. История — на сервере
 * (src/lib/assistant/conversation.ts). Консультант выключен — 404, кнопки на сайте тоже нет.
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
  const answer = await askAssistant(payload, mode, checked.value, hash)
  const status = { ok: 200, limit: 429, busy: 409, failed: 503 }[answer.status]
  return reply(answer, status)
}
