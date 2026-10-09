import config from '@payload-config'
import { getPayload } from 'payload'
import { normalizeCart } from '@/domain/cart.mjs'
import { CartUnavailableError } from '@/domain/checkout.mjs'
import { quoteCart } from '@/lib/cartQuote'
import { findPublicOffer, loadPricingContext, PricingError, quoteOffer } from '@/lib/pricing'

const noStore = { 'Cache-Control': 'no-store' }

/** Итог подбора: несколько предложений одним запросом. Цена каждого — только с сервера. */
async function quoteItems(raw: unknown) {
  const items = normalizeCart(raw)
  if (!items.length) return Response.json({ error: 'Ничего не выбрано' }, { status: 400 })
  const payload = await getPayload({ config })
  const { totalKzt, lines } = await quoteCart(payload, items)
  return Response.json(
    {
      mode: 'demo',
      currency: 'KZT',
      totalKzt,
      lines: lines.map((line) => ({ offerId: line.offerId, totalKzt: line.totalKzt })),
    },
    { headers: noStore },
  )
}

export async function POST(request: Request) {
  if (process.env.APP_MODE !== 'demo')
    return Response.json({ error: 'Рабочий источник цен ещё не подключён' }, { status: 503 })
  try {
    const body = await request.json()
    if (body && Array.isArray(body.items)) return await quoteItems(body.items)
    const { offerId, quantity } = body
    if (
      typeof offerId !== 'string' ||
      !Number.isInteger(quantity) ||
      quantity < 1 ||
      quantity > 999
    )
      return Response.json(
        { error: 'Укажите предложение и целое количество от 1 до 999' },
        { status: 400 },
      )
    const payload = await getPayload({ config })
    const found = await findPublicOffer(payload, offerId)
    if (!found) return Response.json({ error: 'Предложение не найдено' }, { status: 404 })
    const context = await loadPricingContext(payload)
    return Response.json(
      { mode: 'demo', offerId, currency: 'KZT', ...quoteOffer(found.offer, context, quantity) },
      { headers: noStore },
    )
  } catch (error) {
    const message =
      error instanceof PricingError || error instanceof CartUnavailableError
        ? error.message
        : 'Некорректные параметры расчёта'
    return Response.json({ error: message }, { status: 400 })
  }
}
