import type { Payload } from 'payload'
import { quote } from '@/domain/pricing.mjs'
import type { Offer } from '../../payload-types'

/**
 * Серверный расчёт цены по данным CMS: опубликованное предложение, последний курс валюты
 * на текущий момент и ставка НДС из настроек. Арифметика — только src/domain/pricing.mjs.
 */
export type PricingContext = { vat: string; rates: Map<string, { value: string; date: string }> }

export async function loadPricingContext(payload: Payload): Promise<PricingContext> {
  const [settings, rates] = await Promise.all([
    payload.findGlobal({ slug: 'pricing-settings', overrideAccess: true, depth: 0 }),
    payload.find({
      collection: 'exchange-rates',
      where: { effectiveAt: { less_than_equal: new Date().toISOString() } },
      sort: '-effectiveAt',
      limit: 200,
      overrideAccess: true,
      depth: 0,
    }),
  ])
  const latest = new Map<string, { value: string; date: string }>()
  for (const rate of rates.docs) {
    if (!latest.has(rate.currency))
      latest.set(rate.currency, { value: rate.kztPerUnit, date: rate.effectiveAt })
  }
  return { vat: settings.vat || '16', rates: latest }
}

export class PricingError extends Error {}

type PricedOffer = Pick<Offer, 'amount' | 'currency' | 'includesVat' | 'sourceVat'>

export function quoteOffer(offer: PricedOffer, context: PricingContext, quantity = 1) {
  const rate =
    offer.currency === 'KZT' ? { value: '1', date: null } : context.rates.get(offer.currency)
  if (!rate)
    throw new PricingError(`Не задан курс ${offer.currency}. Добавьте его в разделе «Курсы валют».`)
  const result = quote({
    amount: offer.amount,
    rate: rate.value,
    sourceVat: offer.sourceVat,
    targetVat: context.vat,
    includesVat: Boolean(offer.includesVat),
    quantity,
  })
  return { ...result, sourceCurrency: offer.currency, rateDate: rate.date }
}

/** Опубликованное предложение опубликованного товара по ID, который прислал клиент. */
export async function findPublicOffer(payload: Payload, offerId: string) {
  const id = Number(offerId)
  if (!Number.isSafeInteger(id) || id <= 0) return null
  const found = await payload.find({
    collection: 'offers',
    where: { and: [{ id: { equals: id } }, { status: { equals: 'published' } }] },
    limit: 1,
    depth: 1,
    overrideAccess: true,
  })
  const offer = found.docs[0]
  const product = offer?.product
  if (!offer || !product || typeof product === 'number' || product.status !== 'published')
    return null
  return { offer, product }
}
