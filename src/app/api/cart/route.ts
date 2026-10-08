import { normalizeCart } from '@/domain/cart.mjs'
import { demoProducts } from '@/domain/demo'
import { quote } from '@/domain/pricing.mjs'

export async function POST(request: Request) {
  if (process.env.APP_MODE !== 'demo')
    return Response.json({ error: 'Рабочий каталог ещё не подключён' }, { status: 503 })
  try {
    const raw = await request.text()
    if (raw.length > 16000)
      return Response.json({ error: 'Слишком большой запрос' }, { status: 413 })
    const lines = normalizeCart(JSON.parse(raw).items).map(({ offerId, quantity }) => {
      const product = demoProducts.find((product) =>
        product.offers.some((offer) => offer.id === offerId),
      )
      const offer = product?.offers.find((offer) => offer.id === offerId)
      if (!product || !offer) throw new Error('Предложение недоступно. Удалите его из корзины.')
      return {
        offerId,
        productId: product.id,
        title: product.title,
        configuration: offer.title,
        sourceCurrency: offer.currency,
        ...quote({ amount: offer.amount, rate: offer.rate, quantity }),
      }
    })
    const totalKzt = lines.reduce((sum, line) => sum + BigInt(line.totalKzt), 0n).toString()
    return Response.json(
      { mode: 'demo', lines, totalKzt, quotedAt: new Date().toISOString() },
      { headers: { 'Cache-Control': 'no-store' } },
    )
  } catch (error) {
    return Response.json(
      {
        error:
          error instanceof SyntaxError
            ? 'Некорректный запрос'
            : error instanceof Error
              ? error.message
              : 'Не удалось рассчитать корзину',
      },
      { status: 400 },
    )
  }
}
