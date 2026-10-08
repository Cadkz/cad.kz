import config from '@payload-config'
import { getPayload } from 'payload'
import { findPublicOffer, loadPricingContext, PricingError, quoteOffer } from '@/lib/pricing'

export async function POST(request: Request) {
  if (process.env.APP_MODE !== 'demo')
    return Response.json({ error: 'Рабочий источник цен ещё не подключён' }, { status: 503 })
  try {
    const { offerId, quantity } = await request.json()
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
      { headers: { 'Cache-Control': 'no-store' } },
    )
  } catch (error) {
    const message = error instanceof PricingError ? error.message : 'Некорректные параметры расчёта'
    return Response.json({ error: message }, { status: 400 })
  }
}
