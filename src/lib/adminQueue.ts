import type { Payload } from 'payload'
import { daysLeftText, promosEndingSoon } from '@/domain/adminQueue.mjs'
import { KIND_LABELS } from '@/domain/siteRequest.mjs'
import { formatDateTime, formatDay } from './format'

/** Строка в карточке очереди: ссылка на запись и короткая пометка. */
export type QueueItem = { id: string; title: string; href: string; note?: string }

/** Карточка очереди работы на главной админки. */
export type QueueCard = {
  key: string
  title: string
  hint?: string
  total: number
  /** alert — что-то сломалось (ошибки CRM): карточка выделена. */
  tone: 'alert' | 'normal'
  /** Показывать и пустой: справочная карточка (курсы, журнал), а не задача. */
  always?: boolean
  items: QueueItem[]
  empty: string
  more?: { label: string; href: string }
}

const OPTS = { overrideAccess: true, depth: 0 } as const
const DAY = 86_400_000

/** Новые заказы и заявки за неделю — администратору (менеджеры работают в Битрикс24). */
export async function loadRequestsCard(payload: Payload, now: Date): Promise<QueueCard> {
  const since = new Date(now.getTime() - 7 * DAY).toISOString()
  const where = { createdAt: { greater_than_equal: since } }
  const [orders, requests] = await Promise.all([
    payload.find({ collection: 'orders', where, sort: '-createdAt', limit: 5, ...OPTS }),
    payload.find({ collection: 'site-requests', where, sort: '-createdAt', limit: 5, ...OPTS }),
  ])
  const items = [
    ...orders.docs.map((order) => ({
      at: order.createdAt,
      item: {
        id: `order-${order.id}`,
        title: `Заказ ${order.number} — ${order.contactName}`,
        href: `/admin/collections/orders/${order.id}`,
        note: formatDateTime(order.createdAt),
      },
    })),
    ...requests.docs.map((request) => ({
      at: request.createdAt,
      item: {
        id: `request-${request.id}`,
        title: `${KIND_LABELS[request.kind] ?? 'Заявка'} ${request.number} — ${request.contactName ?? ''}`,
        href: `/admin/collections/site-requests/${request.id}`,
        note: formatDateTime(request.createdAt),
      },
    })),
  ]
    .sort((a, b) => b.at.localeCompare(a.at))
    .slice(0, 5)
    .map(({ item }) => item)
  return {
    key: 'requests',
    title: 'Заказы и заявки за неделю',
    hint: 'Менеджеры получают их в Битрикс24. Здесь — чтобы видеть поток с сайта.',
    total: orders.totalDocs + requests.totalDocs,
    tone: 'normal',
    items,
    empty: 'За неделю заказов и заявок не было.',
    more: { label: 'Все заявки', href: '/admin/collections/site-requests' },
  }
}

const CRM_PROBLEM = ['failed', 'dead']

/** Не переданные в CRM заказы и заявки — администратору. */
export async function loadCrmCard(payload: Payload): Promise<QueueCard> {
  const result = await payload.find({
    collection: 'crm-deliveries',
    where: { state: { in: CRM_PROBLEM } },
    sort: '-updatedAt',
    limit: 5,
    overrideAccess: true,
    depth: 1,
  })
  const listHref =
    '/admin/collections/crm-deliveries?where[state][in][0]=failed&where[state][in][1]=dead'
  return {
    key: 'crm',
    title: 'Ошибки передачи в CRM',
    hint: 'Заявка не дошла до Битрикс24 — менеджеры её не видят. Позвоните клиенту сами.',
    total: result.totalDocs,
    tone: result.totalDocs > 0 ? 'alert' : 'normal',
    items: result.docs.map((delivery) => {
      const order = typeof delivery.order === 'object' ? delivery.order : null
      const request = typeof delivery.request === 'object' ? delivery.request : null
      const subject = order
        ? `Заказ ${order.number}`
        : request
          ? `Заявка ${request.number}`
          : 'Запись'
      return {
        id: String(delivery.id),
        title: `${subject}: ${delivery.state === 'dead' ? 'попытки закончились' : 'будет повтор'}`,
        href: `/admin/collections/crm-deliveries/${delivery.id}`,
        note: delivery.lastError ?? undefined,
      }
    }),
    empty: 'Всё передано, ошибок нет.',
    more: result.totalDocs > 5 ? { label: 'Все ошибки', href: listHref } : undefined,
  }
}

/** Действующие акции, которые закончатся в ближайшие 7 дней. */
export async function loadPromosCard(payload: Payload, now: Date): Promise<QueueCard> {
  const result = await payload.find({
    collection: 'publications',
    where: { and: [{ kind: { equals: 'promotion' } }, { status: { equals: 'published' } }] },
    select: { title: true, endsAt: true, publishedAt: true },
    pagination: false,
    ...OPTS,
  })
  const soon = promosEndingSoon(result.docs, now)
  return {
    key: 'promos',
    title: 'Акции заканчиваются',
    hint: 'После даты окончания акция уходит в архив. Продлите дату или подготовьте новую.',
    total: soon.length,
    tone: 'normal',
    items: soon.slice(0, 5).map((promo) => ({
      id: String(promo.id),
      title: promo.title,
      href: `/admin/collections/publications/${promo.id}`,
      note: `до ${formatDay(promo.end.toISOString())}, ${daysLeftText(promo.daysLeft)}`,
    })),
    empty: 'В ближайшие 7 дней ни одна акция не заканчивается.',
  }
}
