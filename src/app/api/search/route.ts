import { suggest } from '@/domain/suggest.mjs'
import { getSearchIndex } from '@/lib/searchIndex'

/**
 * Подсказки поиска: GET /api/search?q=… → { query, items, more }.
 * Только чтение опубликованного каталога; тот же ответ позже сможет получать ИИ-помощник.
 */
export async function GET(request: Request) {
  const query = (new URL(request.url).searchParams.get('q') ?? '').slice(0, 100)
  try {
    const result = suggest(await getSearchIndex(), query)
    return Response.json(result, {
      headers: { 'Cache-Control': 'public, max-age=30, s-maxage=60, stale-while-revalidate=300' },
    })
  } catch {
    return Response.json({ error: 'Поиск временно недоступен' }, { status: 503 })
  }
}
