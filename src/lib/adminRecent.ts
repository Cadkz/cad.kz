import type { Payload, Where } from 'payload'
import { actionLabel } from '@/domain/activity.mjs'
import type { QueueCard } from './adminQueue'
import { formatDateTime, formatDay } from './format'
import { loadPricingContext } from './pricing'

const OPTS = { overrideAccess: true, depth: 0 } as const
const DAY = 86_400_000

/** Черновик старше этого срока считается брошенным и в очередь не попадает. */
const DRAFT_DAYS = 30

const DRAFT_SOURCES = [
  { collection: 'publications', label: 'Публикация' },
  { collection: 'pages', label: 'Страница' },
  { collection: 'products', label: 'Товар' },
] as const

/** Черновики публикаций, страниц и товаров, которые правили за последний месяц. */
export async function loadDraftsCard(payload: Payload, now: Date): Promise<QueueCard> {
  const since = new Date(now.getTime() - DRAFT_DAYS * DAY).toISOString()
  const where: Where = {
    and: [{ status: { equals: 'draft' } }, { updatedAt: { greater_than_equal: since } }],
  }
  const lists = await Promise.all(
    DRAFT_SOURCES.map(async ({ collection, label }) => {
      const result = await payload.find({
        collection,
        where,
        sort: '-updatedAt',
        limit: 5,
        select: { title: true, updatedAt: true },
        ...OPTS,
      })
      return {
        total: result.totalDocs,
        docs: result.docs.map((doc) => ({
          at: doc.updatedAt,
          item: {
            id: `${collection}-${doc.id}`,
            title: doc.title,
            href: `/admin/collections/${collection}/${doc.id}`,
            note: `${label}, правка ${formatDateTime(doc.updatedAt)}`,
          },
        })),
      }
    }),
  )
  return {
    key: 'drafts',
    title: 'Черновики',
    hint: 'Не видны на сайте, пока не выбран статус «Опубликовано». Только правленные за месяц.',
    total: lists.reduce((sum, list) => sum + list.total, 0),
    tone: 'normal',
    items: lists
      .flatMap((list) => list.docs)
      .sort((a, b) => b.at.localeCompare(a.at))
      .slice(0, 5)
      .map(({ item }) => item),
    empty: 'Незаконченных черновиков нет.',
    more: {
      label: 'Черновики публикаций',
      href: '/admin/collections/publications?where[status][equals]=draft',
    },
  }
}

/** Действующие курсы и НДС: от них считаются все цены на сайте. */
export async function loadRatesCard(payload: Payload): Promise<QueueCard> {
  const context = await loadPricingContext(payload)
  const items = [...context.rates.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([currency, rate]) => ({
      id: currency,
      title: `${currency} — ${rate.value} ₸`,
      href: `/admin/collections/exchange-rates?where[currency][equals]=${currency}`,
      note: `с ${formatDay(rate.date)}`,
    }))
  items.push({
    id: 'vat',
    title: `НДС — ${context.vat} %`,
    href: '/admin/globals/pricing-settings',
    note: 'в цене на сайте',
  })
  return {
    key: 'rates',
    title: 'Курсы и НДС',
    hint: 'Новый курс — на странице «Курсы валют»: там же видно, как изменятся цены.',
    total: 0,
    tone: 'normal',
    always: true,
    items,
    empty: 'Курсы не заданы — цены в валюте не считаются.',
    more: { label: 'Курсы валют', href: '/admin/rates' },
  }
}

/** Последние записи журнала важных действий. */
export async function loadActivityCard(payload: Payload): Promise<QueueCard> {
  const result = await payload.find({
    collection: 'activity-log',
    sort: '-createdAt',
    limit: 5,
    overrideAccess: true,
    depth: 1,
  })
  return {
    key: 'activity',
    title: 'Последние важные действия',
    hint: 'Курсы, НДС, прайсы, импорт, удаления. Полностью — «Журнал действий».',
    total: 0,
    tone: 'normal',
    always: true,
    items: result.docs.map((entry) => {
      const who = typeof entry.user === 'object' && entry.user ? entry.user.email : 'сайт'
      return {
        id: String(entry.id),
        title: entry.summary,
        href: entry.link || `/admin/collections/activity-log/${entry.id}`,
        note: `${actionLabel(entry.action)} · ${who} · ${formatDateTime(entry.createdAt)}`,
      }
    }),
    empty: 'Записей пока нет.',
    more: { label: 'Весь журнал', href: '/admin/collections/activity-log' },
  }
}
