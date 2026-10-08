import type { Payload } from 'payload'
import type { CrmGateway, CrmLead } from '@/domain/integrations'
import { attemptDelivery } from '@/domain/outbox.mjs'
import type { CrmDelivery } from '../../../payload-types'

const STALE_PROCESSING_MS = 5 * 60 * 1000
const options = { overrideAccess: true, depth: 0 } as const

/**
 * Берёт запись в работу и делает одну попытку доставки. Запись забирается условным обновлением
 * по времени последнего изменения: если её уже взял другой процесс, обновление ничего не изменит.
 */
async function runDelivery(
  payload: Payload,
  delivery: CrmDelivery,
  gateway: CrmGateway,
  now: Date,
) {
  const claimed = await payload.update({
    collection: 'crm-deliveries',
    where: {
      and: [{ id: { equals: delivery.id } }, { updatedAt: { equals: delivery.updatedAt } }],
    },
    data: { state: 'processing' },
    ...options,
  })
  if (!claimed.docs.length) return null
  const patch = await attemptDelivery(
    {
      snapshot: delivery.snapshot as CrmLead,
      attempts: delivery.attempts ?? 0,
      ambiguous: Boolean(delivery.ambiguous),
    },
    gateway,
    now,
  )
  return payload.update({
    collection: 'crm-deliveries',
    id: delivery.id,
    data: { ...patch, state: patch.state as CrmDelivery['state'] },
    ...options,
  })
}

/** Передаёт в CRM одну заявку по ключу. Ошибки не пробрасываются: заказ к этому моменту уже сохранён. */
export async function deliverByKey(
  payload: Payload,
  idempotencyKey: string,
  gateway: CrmGateway,
  now = new Date(),
) {
  const found = await payload.find({
    collection: 'crm-deliveries',
    where: {
      and: [{ idempotencyKey: { equals: idempotencyKey } }, { state: { equals: 'pending' } }],
    },
    limit: 1,
    ...options,
  })
  const delivery = found.docs[0]
  return delivery ? runDelivery(payload, delivery, gateway, now) : null
}

/** Обработка очереди: подошедшее время повтора и зависшие в работе записи. Для воркера по расписанию. */
export async function deliverDue(
  payload: Payload,
  gateway: CrmGateway,
  limit = 20,
  now = new Date(),
) {
  const due = await payload.find({
    collection: 'crm-deliveries',
    where: {
      or: [
        {
          and: [
            { state: { in: ['pending', 'failed'] } },
            {
              or: [
                { nextAttemptAt: { exists: false } },
                { nextAttemptAt: { less_than_equal: now.toISOString() } },
              ],
            },
          ],
        },
        {
          and: [
            { state: { equals: 'processing' } },
            {
              updatedAt: { less_than: new Date(now.getTime() - STALE_PROCESSING_MS).toISOString() },
            },
          ],
        },
      ],
    },
    sort: 'createdAt',
    limit,
    ...options,
  })
  let processed = 0
  for (const delivery of due.docs) {
    if (await runDelivery(payload, delivery, gateway, now)) processed++
  }
  return processed
}
