import { demoProducts } from '@/domain/demo'
import { quote } from '@/domain/pricing.mjs'
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
    const offer = demoProducts.flatMap((p) => p.offers).find((o) => o.id === offerId)
    if (!offer) return Response.json({ error: 'Предложение не найдено' }, { status: 404 })
    return Response.json({
      mode: 'demo',
      offerId,
      currency: 'KZT',
      ...quote({ amount: offer.amount, rate: offer.rate, quantity }),
    })
  } catch {
    return Response.json({ error: 'Некорректные параметры расчёта' }, { status: 400 })
  }
}
