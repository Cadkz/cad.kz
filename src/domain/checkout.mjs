// @ts-check
// Оформление заказа от проверки формы до сохранения. Работает только через переданные зависимости
// (цена корзины, хранилище, время), поэтому проверяется тестами без базы данных.

import { createHash } from 'node:crypto'
import {
  buildOrderSnapshot,
  CONSENT_TEXT,
  CONSENT_VERSION,
  canonicalRequest,
  makeOrderNumber,
  toCrmLead,
  validateCheckout,
} from './order.mjs'

/** Сколько заявок с одного телефона или адреса принимаем за час. */
export const HOURLY_LIMIT = { phone: 5, client: 10 }
const HOUR_MS = 60 * 60 * 1000
const NUMBER_ATTEMPTS = 3

/** Предложение из корзины недоступно (снято с публикации, удалено). Покупателю показываем текст как есть. */
export class CartUnavailableError extends Error {}

/** @param {import('./order.mjs').CheckoutRequest} request */
export function fingerprintOf(request) {
  return createHash('sha256').update(canonicalRequest(request)).digest('hex')
}

/**
 * @typedef {object} PricedCart
 * @property {string} totalKzt
 * @property {string} quotedAt
 * @property {Array<Record<string, any>>} lines
 *
 * @typedef {object} StoredOrder
 * @property {string} number
 * @property {string} fingerprint
 * @property {string} totalKzt
 * @property {string} savedAt
 * @property {string} mode
 *
 * @typedef {object} NewOrder
 * @property {string} number
 * @property {string} idempotencyKey
 * @property {string} fingerprint
 * @property {string} mode
 * @property {import('./order.mjs').CheckoutRequest['buyer']} buyer
 * @property {string} comment
 * @property {{ accepted: true, at: string, version: string, text: string }} consent
 * @property {import('./order.mjs').OrderSnapshot} snapshot
 * @property {string} clientHash
 *
 * @typedef {object} CheckoutDeps
 * @property {string} mode  Режим сайта: в демо заявка не уходит менеджерам.
 * @property {() => Date} now
 * @property {(max: number) => number} randomIndex
 * @property {(items: Array<{ offerId: string, quantity: number }>) => Promise<PricedCart>} priceCart
 * @property {(key: string) => Promise<StoredOrder | null>} findOrderByKey
 * @property {(filter: { phone: string, clientHash: string, since: Date }) => Promise<{ phone: number, client: number }>} countRecent
 * @property {(entry: { order: NewOrder, crmLead: Record<string, unknown> }) => Promise<StoredOrder>} saveOrder  Заказ и запись очереди CRM одной транзакцией.
 * @property {(error: unknown) => boolean} isDuplicate  Нарушение уникальности ключа или номера.
 *
 * @typedef {{ status: 'invalid', errors: Record<string, string> }
 *   | { status: 'created', order: StoredOrder, idempotencyKey: string }
 *   | { status: 'repeated', order: StoredOrder }
 *   | { status: 'key_conflict' }
 *   | { status: 'cart_unavailable', error: string }
 *   | { status: 'price_changed', quote: PricedCart }
 *   | { status: 'rate_limited', retryAfterSeconds: number }} CheckoutResult
 */

/**
 * @param {StoredOrder} stored
 * @param {string} fingerprint
 * @returns {CheckoutResult}
 */
function replay(stored, fingerprint) {
  return stored.fingerprint === fingerprint
    ? { status: 'repeated', order: stored }
    : { status: 'key_conflict' }
}

/**
 * Цену присылает не клиент: сервер заново считает корзину по предложениям, курсу и НДС.
 * @param {CheckoutDeps} deps
 * @param {import('./order.mjs').CheckoutRequest} request
 * @returns {Promise<{ ok: true, priced: PricedCart } | { ok: false, result: CheckoutResult }>}
 */
async function priceRequest(deps, request) {
  try {
    const priced = await deps.priceCart(request.items)
    if (priced.totalKzt !== request.expectedTotalKzt)
      return { ok: false, result: { status: 'price_changed', quote: priced } }
    return { ok: true, priced }
  } catch (error) {
    if (error instanceof CartUnavailableError)
      return { ok: false, result: { status: 'cart_unavailable', error: error.message } }
    throw error
  }
}

/**
 * @typedef {object} SaveContext
 * @property {CheckoutDeps} deps
 * @property {import('./order.mjs').CheckoutRequest} request
 * @property {string} fingerprint
 * @property {import('./order.mjs').OrderSnapshot} snapshot
 * @property {Date} now
 * @property {{ clientHash: string }} meta
 */

/**
 * @param {SaveContext} context
 * @returns {NewOrder}
 */
function buildOrder({ request, fingerprint, snapshot, now, deps, meta }) {
  return {
    number: makeOrderNumber(now, deps.randomIndex),
    idempotencyKey: request.idempotencyKey,
    fingerprint,
    mode: deps.mode,
    buyer: request.buyer,
    comment: request.comment,
    consent: {
      accepted: true,
      at: now.toISOString(),
      version: CONSENT_VERSION,
      text: CONSENT_TEXT,
    },
    snapshot,
    clientHash: meta.clientHash,
  }
}

/**
 * Сохраняет заказ. Занятый ключ — это параллельный повтор, занятый номер — просто берём другой.
 * @param {SaveContext} context
 * @returns {Promise<CheckoutResult>}
 */
async function save(context) {
  const { deps, request, fingerprint } = context
  for (let attempt = 0; attempt < NUMBER_ATTEMPTS; attempt++) {
    const order = buildOrder(context)
    try {
      const saved = await deps.saveOrder({ order, crmLead: toCrmLead(order) })
      return { status: 'created', order: saved, idempotencyKey: request.idempotencyKey }
    } catch (error) {
      if (!deps.isDuplicate(error)) throw error
      const winner = await deps.findOrderByKey(request.idempotencyKey)
      if (winner) return replay(winner, fingerprint)
    }
  }
  throw new Error('Не удалось присвоить номер заказа')
}

/**
 * @param {unknown} raw Тело запроса.
 * @param {CheckoutDeps} deps
 * @param {{ clientHash: string }} meta
 * @returns {Promise<CheckoutResult>}
 */
export async function submitCheckout(raw, deps, meta) {
  const parsed = validateCheckout(raw)
  if (!parsed.ok) return { status: 'invalid', errors: parsed.errors }
  const request = parsed.value
  const fingerprint = fingerprintOf(request)

  // Повторная отправка той же формы: возвращаем уже сохранённый заказ, цену заново не считаем.
  const existing = await deps.findOrderByKey(request.idempotencyKey)
  if (existing) return replay(existing, fingerprint)

  const now = deps.now()
  const recent = await deps.countRecent({
    phone: request.buyer.phone,
    clientHash: meta.clientHash,
    since: new Date(now.getTime() - HOUR_MS),
  })
  if (recent.phone >= HOURLY_LIMIT.phone || recent.client >= HOURLY_LIMIT.client)
    return { status: 'rate_limited', retryAfterSeconds: 3600 }

  const pricing = await priceRequest(deps, request)
  if (!pricing.ok) return pricing.result

  const { priced } = pricing
  const snapshot = buildOrderSnapshot({ lines: priced.lines, quotedAt: priced.quotedAt })
  return save({ deps, request, fingerprint, snapshot, now, meta })
}
