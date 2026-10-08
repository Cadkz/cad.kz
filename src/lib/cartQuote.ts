import type { Payload } from 'payload'
import { CartUnavailableError } from '@/domain/checkout.mjs'
import { findPublicOffer, loadPricingContext, quoteOffer } from './pricing'

/**
 * Серверный расчёт корзины: единственное место, где строки корзины превращаются в цены.
 * Им пользуются и корзина (/api/cart), и оформление заказа (/api/checkout).
 */
export async function quoteCart(payload: Payload, items: { offerId: string; quantity: number }[]) {
  const context = await loadPricingContext(payload)
  const lines = await Promise.all(
    items.map(async ({ offerId, quantity }) => {
      const found = await findPublicOffer(payload, offerId)
      if (!found) throw new CartUnavailableError('Предложение недоступно. Удалите его из корзины.')
      return {
        offerId,
        productId: found.product.slug,
        title: found.product.title,
        configuration: found.offer.configuration,
        license: found.offer.license,
        ...quoteOffer(found.offer, context, quantity),
      }
    }),
  )
  const totalKzt = lines.reduce((sum, line) => sum + BigInt(line.totalKzt), 0n).toString()
  return { lines, totalKzt, quotedAt: new Date().toISOString() }
}
