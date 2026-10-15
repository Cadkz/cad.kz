import type { Payload } from 'payload'
import type { Offer } from '../../payload-types'
import { loadPricingContext, quoteOffer } from './pricing'

/**
 * Комплектации товара для таблицы внутри карточки товара в админке. Цену на сайте в тенге
 * считает сервер (src/domain/pricing.mjs), браузер только показывает.
 */

export type ProductOfferRow = {
  id: number
  title: string
  configuration: string
  license: string
  amount: string
  currency: Offer['currency']
  /** Цена на сайте, целые тенге; null — не считается (нет курса). */
  kzt: string | null
  published: boolean
  updatedAt: string
}

/** До стольких комплектаций у одного товара показываем таблицей. */
const LIMIT = 500

export async function loadProductOffers(
  payload: Payload,
  productId: number,
): Promise<{ rows: ProductOfferRow[]; more: boolean }> {
  const [found, context] = await Promise.all([
    payload.find({
      collection: 'offers',
      where: { product: { equals: productId } },
      limit: LIMIT,
      depth: 0,
      overrideAccess: true,
    }),
    loadPricingContext(payload),
  ])
  const rows = found.docs.map((offer) => {
    let kzt: string | null = null
    try {
      kzt = quoteOffer(offer, context).unitKzt
    } catch {
      kzt = null
    }
    return {
      id: offer.id,
      title: offer.title,
      configuration: offer.configuration,
      license: offer.license,
      amount: offer.amount,
      currency: offer.currency,
      kzt,
      published: offer.status === 'published',
      updatedAt: offer.updatedAt,
    }
  })
  rows.sort((a, b) =>
    `${a.configuration} ${a.license}`.localeCompare(`${b.configuration} ${b.license}`, 'ru', {
      numeric: true,
    }),
  )
  return { rows, more: found.totalDocs > rows.length }
}
