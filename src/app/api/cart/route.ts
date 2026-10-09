import config from '@payload-config'
import { getPayload } from 'payload'
import { normalizeCart } from '@/domain/cart.mjs'
import { quoteCart } from '@/lib/cartQuote'
import { getCartSuggestions } from '@/lib/recommendations'

export async function POST(request: Request) {
  if (process.env.APP_MODE !== 'demo')
    return Response.json({ error: 'Рабочий каталог ещё не подключён' }, { status: 503 })
  try {
    const raw = await request.text()
    if (raw.length > 16000)
      return Response.json({ error: 'Слишком большой запрос' }, { status: 413 })
    const items = normalizeCart(JSON.parse(raw).items)
    const payload = await getPayload({ config })
    const quoted = await quoteCart(payload, items)
    // Подборка не должна ломать расчёт корзины: при сбое корзина просто без неё.
    const suggestions = await getCartSuggestions(
      payload,
      quoted.lines.map((line) => line.productId),
    ).catch(() => [])
    return Response.json(
      { mode: 'demo', ...quoted, suggestions },
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
