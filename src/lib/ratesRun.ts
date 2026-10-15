import type { Payload } from 'payload'
import { parseAmount, priceChange, RATE, RATE_CURRENCIES, rateStart } from '@/domain/priceEdit.mjs'
import type { ExchangeRate } from '../../payload-types'
import type { Reply } from './priceListRun'
import { loadPricingContext, type PricingContext, quoteOffer } from './pricing'
import { relId } from './rel'

/**
 * «Курсы валют» одной страницей: действующий курс каждой валюты, запланированные и прошлые,
 * сколько цен от него зависит. Новый курс — новой записью с датой (старые не правятся),
 * перед записью — сводка: как изменятся цены. Запись курса сама попадает в «Журнал действий».
 */

const opts = { overrideAccess: true, depth: 0 } as const
type Currency = ExchangeRate['currency']

export type RateCard = {
  currency: Currency
  current: { value: string; date: string } | null
  /** Курсы с будущей датой: вступят в силу сами. */
  planned: { value: string; date: string }[]
  history: { value: string; date: string }[]
  offers: number
  published: number
}

export async function loadRates(payload: Payload, now = new Date()) {
  const [rates, offers, vat] = await Promise.all([
    payload.find({
      collection: 'exchange-rates',
      sort: '-effectiveAt',
      limit: 300,
      ...opts,
    }),
    payload.find({
      collection: 'offers',
      pagination: false,
      ...opts,
      select: { currency: true, status: true },
    }),
    payload.findGlobal({ slug: 'pricing-settings', ...opts }),
  ])
  const cards: RateCard[] = RATE_CURRENCIES.map((currency) => {
    const own = rates.docs
      .filter((rate) => rate.currency === currency)
      .map((rate) => ({ value: rate.kztPerUnit, date: rate.effectiveAt }))
    const past = own.filter((rate) => new Date(rate.date) <= now)
    const inCurrency = offers.docs.filter((offer) => offer.currency === currency)
    return {
      currency,
      current: past[0] ?? null,
      planned: own.filter((rate) => new Date(rate.date) > now).reverse(),
      history: past.slice(1, 6),
      offers: inCurrency.length,
      published: inCurrency.filter((offer) => offer.status === 'published').length,
    }
  })
  return { cards, vat: vat.vat || '16' }
}

const fail = (error: string, status = 400): Reply => ({ ok: false, status, error })

type NewRate = { currency: Currency; value: string; at: string; day: string }

function readRates(raw: unknown, now: Date): NewRate[] | string {
  if (!Array.isArray(raw) || !raw.length) return 'Впишите новый курс хотя бы одной валюты'
  const items: NewRate[] = []
  for (const item of raw.slice(0, RATE_CURRENCIES.length)) {
    const row = (item ?? {}) as Record<string, unknown>
    const currency = RATE_CURRENCIES.find((c: string) => c === row.currency) as Currency | undefined
    if (!currency) return 'Неизвестная валюта'
    if (items.some((other) => other.currency === currency)) return `${currency} указан дважды`
    const value = parseAmount(String(row.value ?? ''), RATE)
    if (!value || Number(value) <= 0)
      return `${currency}: курс — число больше нуля, например 550 или 6,1`
    const day = String(row.day ?? '')
    const start = rateStart(day, now)
    if ('error' in start) return `${currency}: ${start.error}`
    items.push({ currency, value, at: start.at, day })
  }
  return items
}

/** Тот же курс с сегодняшнего дня — записывать нечего. */
function sameRate(items: NewRate[], context: PricingContext, now: Date) {
  const same = items.find(
    (item) =>
      item.at === now.toISOString() && context.rates.get(item.currency)?.value === item.value,
  )
  return same ? `${same.currency}: такой курс уже действует` : null
}

type Example = { label: string; oldKzt: string | null; newKzt: string | null }

/** Пример цен: до трёх опубликованных предложений в этой валюте, сейчас и с новым курсом. */
async function examples(
  payload: Payload,
  currency: Currency,
  context: PricingContext,
  value: string,
): Promise<Example[]> {
  const found = await payload.find({
    collection: 'offers',
    where: { and: [{ currency: { equals: currency } }, { status: { equals: 'published' } }] },
    limit: 3,
    sort: 'title',
    ...opts,
  })
  const next: PricingContext = {
    ...context,
    rates: new Map(context.rates).set(currency, { value, date: '' }),
  }
  const productIds = found.docs.map((offer) => relId(offer.product)).filter((id) => id != null)
  const products = productIds.length
    ? await payload.find({
        collection: 'products',
        where: { id: { in: productIds } },
        pagination: false,
        ...opts,
        select: { title: true },
      })
    : { docs: [] }
  const titles = new Map(products.docs.map((product) => [product.id, product.title]))
  const kzt = (offer: (typeof found.docs)[number], ctx: PricingContext) => {
    try {
      return quoteOffer(offer, ctx).unitKzt
    } catch {
      return null
    }
  }
  return found.docs.map((offer) => ({
    label: [titles.get(relId(offer.product) ?? -1), offer.configuration]
      .filter((part) => part && part !== 'Базовая')
      .join(' · '),
    oldKzt: kzt(offer, context),
    newKzt: kzt(offer, next),
  }))
}

/** Сводка перед записью: курс было → станет, сколько цен пересчитается, примеры. */
export async function previewRates(
  payload: Payload,
  data: Record<string, unknown>,
): Promise<Reply> {
  const now = new Date()
  const items = readRates(data.items, now)
  if (typeof items === 'string') return fail(items)
  const [context, page] = await Promise.all([loadPricingContext(payload), loadRates(payload, now)])
  const same = sameRate(items, context, now)
  if (same) return fail(same)
  const rows = await Promise.all(
    items.map(async (item) => {
      const card = page.cards.find((c) => c.currency === item.currency)
      const from = context.rates.get(item.currency)?.value ?? null
      return {
        currency: item.currency,
        from,
        to: item.value,
        day: item.day,
        now: item.at === now.toISOString(),
        change: priceChange(from, item.value),
        offers: card?.offers ?? 0,
        published: card?.published ?? 0,
        examples: await examples(payload, item.currency, context, item.value),
      }
    }),
  )
  return { ok: true, rows }
}

/** Запись новых курсов. Изменение больше 30 % — только с подтверждением (confirmBig). */
export async function applyRates(
  payload: Payload,
  data: Record<string, unknown>,
  user: { id: number | string },
): Promise<Reply> {
  const now = new Date()
  const items = readRates(data.items, now)
  if (typeof items === 'string') return fail(items)
  const context = await loadPricingContext(payload)
  const same = sameRate(items, context, now)
  if (same) return fail(same)
  const big = items.some(
    (item) => priceChange(context.rates.get(item.currency)?.value ?? null, item.value)?.big,
  )
  if (big && data.confirmBig !== true)
    return fail('Курс меняется больше чем на 30 %: подтвердите галочкой в сводке.')
  const saved: string[] = []
  for (const item of items) {
    await payload.create({
      collection: 'exchange-rates',
      data: { currency: item.currency, kztPerUnit: item.value, effectiveAt: item.at },
      ...opts,
      // От имени человека: в «Журнале действий» видно, кто поменял курс.
      user: { ...user, collection: 'users' },
    })
    saved.push(item.currency)
  }
  return { ok: true, saved, cards: (await loadRates(payload)).cards }
}
