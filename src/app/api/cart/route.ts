import config from '@payload-config'
import { getPayload } from 'payload'
import { normalizeCart } from '@/domain/cart.mjs'
import { findPublicOffer, loadPricingContext, quoteOffer } from '@/lib/pricing'

export async function POST(request: Request) {
  if (process.env.APP_MODE !== 'demo')
    return Response.json({ error: 'Рабочий каталог ещё не подключён' }, { status: 503 })
  try {
    const raw = await request.text()
    if (raw.length > 16000)
      return Response.json({ error: 'Слишком большой запрос' }, { status: 413 })
    const items = normalizeCart(JSON.parse(raw).items)
    const payload = await getPayload({ config })
    const context = await loadPricingContext(payload)
    const lines = await Promise.all(
      items.map(async ({ offerId, quantity }) => {
        const found = await findPublicOffer(payload, offerId)
        if (!found) throw new Error('Предложение недоступно. Удалите его из корзины.')
        return {
          offerId,
          productId: found.product.slug,
          title: found.product.title,
          configuration: found.offer.configuration,
          ...quoteOffer(found.offer, context, quantity),
        }
      }),
    )
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
