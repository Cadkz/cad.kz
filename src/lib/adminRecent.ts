import type { Payload } from 'payload'
import { actionLabel } from '@/domain/activity.mjs'
import type { QueueCard } from './adminQueue'
import { formatDateTime, formatDay } from './format'
import { loadPricingContext } from './pricing'

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
