import type { Payload } from 'payload'
import { parseRequestKey } from '@/domain/cart.mjs'
import { CartUnavailableError } from '@/domain/checkout.mjs'
import { PRICE_RULE } from '@/domain/pricing.mjs'
import { plainTitle } from '@/domain/productTitle.mjs'
import { findPublicOffer, loadPricingContext, type PricingContext, quoteOffer } from './pricing'
import { productPath } from './productPath'

/** Подпись строки-запроса в корзине, заказе и лиде: менеджеру видно, что комплектацию выбирают с ним. */
export const REQUEST_CONFIGURATION = 'Комплектацию и цену подберёт менеджер'

const unavailable = () => new CartUnavailableError('Товар недоступен. Удалите его из корзины.')

/**
 * Строка-запрос: товар или семейство без выбранной комплектации (src/domain/cart.mjs). Цены нет,
 * сумма 0 — в итог не входит; поля расчёта те же, что у строки с ценой, чтобы снимок заказа
 * оставался одного вида.
 */
async function quoteRequest(
  payload: Payload,
  key: { kind: 'product' | 'line'; id: number },
  context: PricingContext,
) {
  const published = { status: { equals: 'published' } } as const
  const found =
    key.kind === 'product'
      ? await payload.find({
          collection: 'products',
          where: { and: [{ id: { equals: key.id } }, published] },
          limit: 1,
          depth: 0,
          overrideAccess: true,
        })
      : null
  const product = found?.docs[0]
  const line =
    key.kind === 'line'
      ? (
          await payload.find({
            collection: 'product-lines',
            where: {
              and: [{ id: { equals: key.id } }, published, { familyPage: { equals: true } }],
            },
            limit: 1,
            depth: 0,
            overrideAccess: true,
          })
        ).docs[0]
      : undefined
  const item = product
    ? { slug: product.slug, href: productPath(product), title: product.title }
    : line?.slug
      ? { slug: line.slug, href: `/families/${line.slug}`, title: line.title }
      : null
  if (!item) throw unavailable()
  return {
    productId: item.slug,
    href: item.href,
    title: plainTitle(item.title),
    configuration: REQUEST_CONFIGURATION,
    license: '',
    request: true,
    unitKzt: '',
    totalKzt: '0',
    vatMinor: '0',
    amount: '0',
    rate: '1',
    sourceVat: context.vat,
    targetVat: context.vat,
    includesVat: true,
    sourceCurrency: 'KZT',
    rateDate: null,
    rule: PRICE_RULE,
  }
}

/**
 * Серверный расчёт корзины: единственное место, где строки корзины превращаются в цены.
 * Им пользуются и корзина (/api/cart), и оформление заказа (/api/checkout).
 */
export async function quoteCart(payload: Payload, items: { offerId: string; quantity: number }[]) {
  const context = await loadPricingContext(payload)
  const lines = await Promise.all(
    items.map(async ({ offerId, quantity }) => {
      const request = parseRequestKey(offerId)
      if (request) return { offerId, quantity, ...(await quoteRequest(payload, request, context)) }
      const found = await findPublicOffer(payload, offerId)
      if (!found) throw unavailable()
      return {
        offerId,
        productId: found.product.slug,
        href: productPath(found.product),
        title: plainTitle(found.product.title),
        configuration: found.offer.configuration,
        license: found.offer.license,
        request: false,
        ...quoteOffer(found.offer, context, quantity),
      }
    }),
  )
  const totalKzt = lines.reduce((sum, line) => sum + BigInt(line.totalKzt), 0n).toString()
  return { lines, totalKzt, quotedAt: new Date().toISOString() }
}
