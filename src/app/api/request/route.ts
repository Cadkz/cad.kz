import config from '@payload-config'
import { getPayload } from 'payload'
import { createRateLimiter } from '@/domain/rateLimit.mjs'
import { validateRequest } from '@/domain/siteRequest.mjs'
import { clientHash } from '@/lib/checkout'
import { bitrix24TestGateway } from '@/lib/crm/bitrix24Test'
import { deliverByKey } from '@/lib/crm/outbox'
import { saveSiteRequest } from '@/lib/siteRequest'

const MAX_BODY = 8000
const globalStore = globalThis as { __requestLimiter?: ReturnType<typeof createRateLimiter> }
globalStore.__requestLimiter ??= createRateLimiter({ limit: 6, windowMs: 60_000 })
const limiter = globalStore.__requestLimiter

function reply(body: Record<string, unknown>, status: number) {
  return Response.json(body, { status, headers: { 'Cache-Control': 'no-store' } })
}

/**
 * Заявка без корзины: «Перезвоните мне» на странице товара или семейства. Сохраняется вместе
 * с записью очереди CRM; в демо менеджерам не передаётся, и ответ говорит об этом честно.
 */
export async function POST(request: Request) {
  if (process.env.APP_MODE !== 'demo')
    return reply({ status: 'unavailable', error: 'Заявки ещё не подключены' }, 503)
  if (!request.headers.get('content-type')?.startsWith('application/json'))
    return reply({ status: 'bad_request', error: 'Некорректный запрос' }, 415)
  const hash = clientHash(request)
  if (hash && !limiter.check(hash).allowed)
    return reply({ status: 'rate_limited', error: 'Слишком много попыток. Подождите минуту.' }, 429)
  const text = await request.text()
  if (text.length > MAX_BODY)
    return reply({ status: 'bad_request', error: 'Слишком большой запрос' }, 413)
  let body: unknown
  try {
    body = JSON.parse(text)
  } catch {
    return reply({ status: 'bad_request', error: 'Некорректный запрос' }, 400)
  }
  const checked = validateRequest(body)
  if (!checked.ok) return reply({ status: 'invalid', errors: checked.errors }, 422)

  const payload = await getPayload({ config })
  const saved = await saveSiteRequest(payload, checked.value, hash)
  if (saved === 'rate_limited')
    return reply(
      {
        status: 'rate_limited',
        error: 'С этого телефона за последний час уже было много заявок. Попробуйте позже.',
      },
      429,
    )
  if (!saved.repeated) {
    try {
      await deliverByKey(payload, saved.idempotencyKey, bitrix24TestGateway)
    } catch (error) {
      console.error('Не удалось обработать очередь CRM', error)
    }
  }
  return reply(
    { status: 'created', mode: 'demo', number: saved.number },
    saved.repeated ? 200 : 201,
  )
}
