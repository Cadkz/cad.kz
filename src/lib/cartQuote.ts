import type { Payload } from 'payload'
import { parseRequestKey } from '@/domain/cart.mjs'
import { CartUnavailableError } from '@/domain/checkout.mjs'
import { PRICE_RULE } from '@/domain/pricing.mjs'
import { plainTitle } from '@/domain/productTitle.mjs'
import { findPublicOffer, loadPricingContext, type PricingContext, quoteOffer } from './pricing'
import { productPath } from './productPath'

/** Подпись строки-запроса в корзине, заказе и лиде: менеджеру видно, что комплектацию выбирают с ним. */
export const REQUEST_CONFIGURATION = 'Комплектацию и цену подберёт менеджер'

/**
 * Цена «от» строки-запроса — самая низкая комплектация с ценой у товара или у программ семейства,
 * как «от» в карточке каталога (замечание владельца 03.11.2026: в корзине было «по запросу»,
 * хотя в каталоге цена видна). Комплектацию и окончательную цену подтверждает менеджер.
 */
async function cheapestUnit(payload: Payload, productIds: number[], context: PricingContext) {
  if (!productIds.length) return ''
  const { docs } = await payload.find({
    collection: 'offers',
    where: { and: [{ product: { in: productIds } }, { status: { equals: 'published' } }] },
    limit: 500,
    depth: 0,
    pagination: false,
    overrideAccess: true,
  })
  let best: bigint | null = null
  for (const offer of docs) {
    try {
      const unit = BigInt(quoteOffer(offer, context).unitKzt)
      if (unit > 0n && (best == null || unit < best)) best = unit
    } catch {
      // Комплектация без цены — пропускаем.
    }
  }
  return best == null ? '' : best.toString()
}

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
  const ids = product
    ? [product.id]
    : line
      ? (
          await payload.find({
            collection: 'products',
            where: { and: [{ line: { equals: line.id } }, published] },
            limit: 200,
            depth: 0,
            pagination: false,
            overrideAccess: true,
          })
        ).docs.map((doc) => doc.id)
      : []
  const fromKzt = await cheapestUnit(payload, ids, context)
  return {
    fromKzt,
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
      if (request) {
        const quoted = await quoteRequest(payload, request, context)
        const fromLineKzt = quoted.fromKzt
          ? (BigInt(quoted.fromKzt) * BigInt(quantity)).toString()
          : ''
        return { offerId, quantity, ...quoted, fromLineKzt }
      }
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
        fromKzt: '',
        fromLineKzt: '',
        ...quoteOffer(found.offer, context, quantity),
      }
    }),
  )
  const totalKzt = lines.reduce((sum, line) => sum + BigInt(line.totalKzt), 0n).toString()
  // Итог «от»: цены строк плюс «от» строк-запросов; запрос без цены — fromComplete = false.
  const fromTotalKzt = lines
    .reduce((sum, line) => sum + BigInt(line.request ? line.fromLineKzt || '0' : line.totalKzt), 0n)
    .toString()
  const fromComplete = lines.every((line) => !line.request || line.fromKzt !== '')
  return { lines, totalKzt, fromTotalKzt, fromComplete, quotedAt: new Date().toISOString() }
}
