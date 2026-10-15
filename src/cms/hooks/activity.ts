import type {
  CollectionAfterChangeHook,
  CollectionAfterDeleteHook,
  GlobalAfterChangeHook,
} from 'payload'
import type { CrmDelivery, ExchangeRate, User } from '../../../payload-types'
import { crmSummary, rateSummary, vatSummary } from '../../domain/activity.mjs'
import { logActivity } from '../../lib/activity'

/** Курс валюты: новый или исправленный — с прежним значением этой валюты. */
export const logRateChange: CollectionAfterChangeHook<ExchangeRate> = async ({
  doc,
  previousDoc,
  operation,
  req,
}) => {
  if (
    operation === 'update' &&
    previousDoc?.kztPerUnit === doc.kztPerUnit &&
    previousDoc?.effectiveAt === doc.effectiveAt
  )
    return doc
  let previous: string | null = operation === 'update' ? (previousDoc?.kztPerUnit ?? null) : null
  if (operation === 'create') {
    const { docs } = await req.payload.find({
      collection: 'exchange-rates',
      where: {
        and: [
          { currency: { equals: doc.currency } },
          { id: { not_equals: doc.id } },
          { effectiveAt: { less_than_equal: doc.effectiveAt } },
        ],
      },
      sort: '-effectiveAt',
      limit: 1,
      depth: 0,
      overrideAccess: true,
      req,
    })
    previous = docs[0]?.kztPerUnit ?? null
  }
  await logActivity(req.payload, {
    action: 'rate',
    summary: rateSummary(doc, previous),
    userId: req.user?.id,
    link: `/admin/collections/exchange-rates/${doc.id}`,
  })
  return doc
}

/** НДС в «Настройках цены»: только когда ставка поменялась. */
export const logVatChange: GlobalAfterChangeHook = async ({ doc, previousDoc, req }) => {
  const vat = String(doc.vat ?? '')
  const was = previousDoc?.vat == null ? null : String(previousDoc.vat)
  if (vat === was) return doc
  await logActivity(req.payload, {
    action: 'vat',
    summary: vatSummary(vat, was),
    userId: req.user?.id,
    link: '/admin/globals/pricing-settings',
  })
  return doc
}

/** Передача в CRM: отправлено, ошибка или попытки закончились. */
export const logCrmChange: CollectionAfterChangeHook<CrmDelivery> = async ({
  doc,
  previousDoc,
  operation,
  req,
}) => {
  const previousState = operation === 'update' ? previousDoc?.state : null
  const orderId = typeof doc.order === 'object' ? doc.order?.id : doc.order
  const requestId = typeof doc.request === 'object' ? doc.request?.id : doc.request
  let subject = 'Запись'
  if (orderId) {
    const order = await req.payload
      .findByID({ collection: 'orders', id: orderId, depth: 0, overrideAccess: true, req })
      .catch(() => null)
    subject = order ? `Заказ ${order.number}` : 'Заказ'
  } else if (requestId) {
    const request = await req.payload
      .findByID({ collection: 'site-requests', id: requestId, depth: 0, overrideAccess: true, req })
      .catch(() => null)
    subject = request ? `Заявка ${request.number}` : 'Заявка'
  }
  const summary = crmSummary(doc, previousState, subject)
  if (!summary) return doc
  await logActivity(req.payload, {
    action: 'crm',
    summary,
    link: `/admin/collections/crm-deliveries/${doc.id}`,
  })
  return doc
}

const ROLES: Record<string, string> = { admin: 'администратор', editor: 'редактор' }

/** Новый пользователь и смена роли. */
export const logUserChange: CollectionAfterChangeHook<User> = async ({
  doc,
  previousDoc,
  operation,
  req,
}) => {
  const role = ROLES[doc.role] ?? doc.role
  let summary: string | null = null
  if (operation === 'create') summary = `Добавлен пользователь ${doc.email} (${role})`
  else if (previousDoc && previousDoc.role !== doc.role)
    summary = `${doc.email}: роль ${ROLES[previousDoc.role] ?? previousDoc.role} → ${role}`
  if (!summary) return doc
  await logActivity(req.payload, {
    action: 'users',
    summary,
    userId: req.user?.id,
    link: `/admin/collections/users/${doc.id}`,
  })
  return doc
}

/**
 * Удаление записи человеком из админки. Удаления, которые делает сам сайт (замена базы знаний
 * Кадди, автонастройка), не пишутся — иначе журнал утонет в сотнях строк.
 */
export function logDelete(what: string): CollectionAfterDeleteHook {
  return async ({ doc, req, collection }) => {
    if (!req.user) return doc
    const record = doc as Record<string, unknown>
    const name = String(
      record.title ?? record.email ?? record.from ?? record.filename ?? `№${record.id}`,
    )
    await logActivity(req.payload, {
      action: 'delete',
      summary: `Удалено: ${what} «${name}»`,
      userId: req.user.id,
      link: `/admin/collections/${collection.slug}`,
      details: { collection: collection.slug, id: record.id },
    })
    return doc
  }
}
