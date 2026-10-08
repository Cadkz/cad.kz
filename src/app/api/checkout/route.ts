import config from '@payload-config'
import { getPayload, type Payload } from 'payload'
import { type CheckoutResult, submitCheckout } from '@/domain/checkout.mjs'
import { createRateLimiter } from '@/domain/rateLimit.mjs'
import { clientHash, createCheckoutDeps } from '@/lib/checkout'
import { bitrix24TestGateway } from '@/lib/crm/bitrix24Test'
import { deliverByKey } from '@/lib/crm/outbox'
import { PricingError } from '@/lib/pricing'

const MAX_BODY = 16000

// Первый заслон от частых отправок. На хостинге с несколькими копиями сервера у каждой свой счётчик,
// поэтому общий лимит по телефону и адресу дополнительно считается по базе (см. домен).
const globalStore = globalThis as { __checkoutLimiter?: ReturnType<typeof createRateLimiter> }
globalStore.__checkoutLimiter ??= createRateLimiter({ limit: 6, windowMs: 60_000 })
const limiter = globalStore.__checkoutLimiter

function reply(
  body: Record<string, unknown>,
  status: number,
  headers: Record<string, string> = {},
) {
  return Response.json(body, { status, headers: { 'Cache-Control': 'no-store', ...headers } })
}

const bad = (error: string, status: number) => reply({ status: 'bad_request', error }, status)

/** Проверки до чтения тела: режим сайта, тип запроса, частота с одного адреса. */
function guard(request: Request, hash: string) {
  if (process.env.APP_MODE !== 'demo')
    return reply({ status: 'unavailable', error: 'Оформление заказа ещё не подключено' }, 503)
  if (!request.headers.get('content-type')?.startsWith('application/json'))
    return bad('Некорректный запрос', 415)
  const limit = hash ? limiter.check(hash) : { allowed: true, retryAfterMs: 0 }
  if (limit.allowed) return null
  return reply(
    {
      status: 'rate_limited',
      error: 'Слишком много попыток. Подождите немного и отправьте форму ещё раз.',
    },
    429,
    { 'Retry-After': String(Math.ceil(limit.retryAfterMs / 1000)) },
  )
}

async function readJson(request: Request): Promise<{ body: unknown } | { failure: Response }> {
  const text = await request.text()
  if (text.length > MAX_BODY) return { failure: bad('Слишком большой запрос', 413) }
  try {
    return { body: JSON.parse(text) }
  } catch {
    return { failure: bad('Некорректный запрос', 400) }
  }
}

/** Передача в CRM идёт уже после сохранения, её сбой не отменяет заказ. */
async function passToCrm(payload: Payload, idempotencyKey: string) {
  try {
    // Ждём результат: на хостинге с функциями работа после ответа может не завершиться.
    await deliverByKey(payload, idempotencyKey, bitrix24TestGateway)
  } catch (error) {
    console.error('Не удалось обработать очередь CRM', error)
  }
}

async function respond(result: CheckoutResult, payload: Payload) {
  switch (result.status) {
    case 'invalid':
      return reply({ status: 'invalid', errors: result.errors }, 422)
    case 'key_conflict':
      return reply(
        {
          status: 'key_conflict',
          error:
            'Эта форма уже была отправлена с другими данными. Обновите страницу и оформите заказ заново.',
        },
        409,
      )
    case 'cart_unavailable':
      return reply({ status: 'cart_unavailable', error: result.error }, 409)
    case 'price_changed':
      return reply(
        {
          status: 'price_changed',
          error: 'Цена изменилась. Проверьте новую сумму и подтвердите заказ ещё раз.',
          quote: result.quote,
        },
        409,
      )
    case 'rate_limited':
      return reply(
        {
          status: 'rate_limited',
          error: 'С этих данных за последний час уже было много заявок. Попробуйте позже.',
        },
        429,
        { 'Retry-After': String(result.retryAfterSeconds) },
      )
    case 'created':
      await passToCrm(payload, result.idempotencyKey)
      return reply(
        { status: 'created', mode: result.order.mode, order: publicOrder(result.order) },
        201,
      )
    case 'repeated':
      return reply(
        { status: 'repeated', mode: result.order.mode, order: publicOrder(result.order) },
        200,
      )
  }
}

function publicOrder({
  number,
  totalKzt,
  savedAt,
}: {
  number: string
  totalKzt: string
  savedAt: string
}) {
  return { number, totalKzt, savedAt }
}

export async function POST(request: Request) {
  const hash = clientHash(request)
  const blocked = guard(request, hash)
  if (blocked) return blocked
  const parsed = await readJson(request)
  if ('failure' in parsed) return parsed.failure

  try {
    const payload = await getPayload({ config })
    const result = await submitCheckout(parsed.body, createCheckoutDeps(payload), {
      clientHash: hash,
    })
    return await respond(result, payload)
  } catch (error) {
    if (error instanceof PricingError)
      return reply(
        {
          status: 'pricing_unavailable',
          error: 'Сейчас не удаётся рассчитать цену. Попробуйте позже.',
        },
        503,
      )
    console.error('Ошибка оформления заказа', error)
    return reply(
      {
        status: 'error',
        error: 'Не удалось сохранить заявку. Повторите отправку: дубля не будет.',
      },
      500,
    )
  }
}
