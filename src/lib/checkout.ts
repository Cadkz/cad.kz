import { createHmac, randomInt } from 'node:crypto'
import {
  commitTransaction,
  createLocalReq,
  initTransaction,
  killTransaction,
  type Payload,
  ValidationError,
  type Where,
} from 'payload'
import type { CheckoutDeps, NewOrder } from '@/domain/checkout.mjs'
import type { Order } from '../../payload-types'
import { quoteCart } from './cartQuote'

const options = { overrideAccess: true, depth: 0 } as const

function stored(doc: Order) {
  return {
    number: doc.number,
    fingerprint: doc.fingerprint,
    totalKzt: doc.totalKzt,
    savedAt: doc.createdAt,
    mode: doc.mode,
  }
}

/** Нарушение уникальности ключа заявки или номера заказа. */
function isUniqueViolation(error: unknown) {
  if (error instanceof ValidationError)
    return error.data.errors.some((item) => /unique|уникаль/i.test(item.message))
  const code = (error as { code?: string; cause?: { code?: string } } | null)?.cause?.code
  return code === '23505'
}

function orderData(order: NewOrder): Omit<Order, 'id' | 'createdAt' | 'updatedAt'> {
  const { buyer, consent } = order
  return {
    number: order.number,
    mode: order.mode === 'live' ? 'live' : 'demo',
    buyerType: buyer.type,
    contactName: buyer.name,
    contactPhone: buyer.phone,
    contactEmail: buyer.email,
    companyName: buyer.companyName,
    bin: buyer.bin,
    comment: order.comment || undefined,
    totalKzt: order.snapshot.totalKzt,
    consent,
    // Копия: снимок заморожен, а Payload может обходить значение при сохранении.
    snapshot: structuredClone(order.snapshot),
    idempotencyKey: order.idempotencyKey,
    fingerprint: order.fingerprint,
    clientHash: order.clientHash || undefined,
  }
}

/** Отметка адреса покупателя для лимита частоты. Сам адрес не храним: только необратимый отпечаток. */
export function clientHash(request: Request) {
  const forwarded = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim()
  const address = request.headers.get('x-real-ip') ?? forwarded
  if (!address) return ''
  return createHmac('sha256', process.env.PAYLOAD_SECRET ?? '')
    .update(address)
    .digest('hex')
    .slice(0, 16)
}

/** Подключает домен оформления к Payload: поиск, подсчёт, пересчёт корзины и транзакция «заказ + очередь CRM». */
export function createCheckoutDeps(payload: Payload): CheckoutDeps {
  return {
    mode: 'demo',
    now: () => new Date(),
    randomIndex: (max) => randomInt(max),
    priceCart: (items) => quoteCart(payload, items),
    async findOrderByKey(key) {
      const found = await payload.find({
        collection: 'orders',
        where: { idempotencyKey: { equals: key } },
        limit: 1,
        ...options,
      })
      return found.docs[0] ? stored(found.docs[0]) : null
    },
    async countRecent({ phone, clientHash: hash, since }) {
      const after = { createdAt: { greater_than: since.toISOString() } }
      const count = (where: Where) =>
        payload.count({
          collection: 'orders',
          where: { and: [after, where] },
          overrideAccess: true,
        })
      const [byPhone, byClient] = await Promise.all([
        count({ contactPhone: { equals: phone } }),
        hash ? count({ clientHash: { equals: hash } }) : null,
      ])
      return { phone: byPhone.totalDocs, client: byClient?.totalDocs ?? 0 }
    },
    async saveOrder({ order, crmLead }) {
      // Заказ и запись очереди CRM сохраняются одной транзакцией: либо обе, либо ни одной.
      const req = await createLocalReq({}, payload)
      const owner = await initTransaction(req)
      try {
        const created = await payload.create({
          collection: 'orders',
          data: orderData(order),
          req,
          ...options,
        })
        await payload.create({
          collection: 'crm-deliveries',
          data: {
            idempotencyKey: order.idempotencyKey,
            order: created.id,
            state: 'pending',
            attempts: 0,
            snapshot: structuredClone(crmLead),
          },
          req,
          ...options,
        })
        if (owner) await commitTransaction(req)
        return stored(created)
      } catch (error) {
        if (owner) await killTransaction(req)
        throw error
      }
    },
    isDuplicate: isUniqueViolation,
  }
}
