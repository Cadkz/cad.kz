import config from '@payload-config'
import { getPayload } from 'payload'
import { normalizeCart } from '@/domain/cart.mjs'
import { isLang } from '@/i18n/locales.mjs'
import { localizeCartLines, quoteCart } from '@/lib/cartQuote'

export async function POST(request: Request) {
  if (process.env.APP_MODE !== 'demo')
    return Response.json({ error: 'Рабочий каталог ещё не подключён' }, { status: 503 })
  try {
    const raw = await request.text()
    if (raw.length > 16000)
      return Response.json({ error: 'Слишком большой запрос' }, { status: 413 })
    const body = JSON.parse(raw)
    const items = normalizeCart(body.items)
    // Язык страницы корзины: названия и комплектации для показа (/kk/cart, /en/cart).
    const lang = isLang(body.lang) ? body.lang : 'ru'
    const payload = await getPayload({ config })
    const quoted = await quoteCart(payload, items)
    const lines = await localizeCartLines(payload, quoted.lines, lang)
    return Response.json(
      { mode: 'demo', ...quoted, lines },
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
