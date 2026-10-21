import { clientItems, getCatalog } from '@/lib/catalog'

/**
 * Каталог для фильтра на главной: GET /api/catalog → { items, facets, lines }.
 * Главная не кладёт весь каталог в страницу (аудит 21.10.2026, пакет 7 «Скорость»): телефону он не
 * нужен, компьютер догружает его отсюда. Только чтение опубликованного; кэш на минуту, потом
 * отдаётся старый ответ, пока готовится новый.
 */
export async function GET() {
  try {
    const catalog = await getCatalog()
    return Response.json(
      {
        items: clientItems([...catalog.items, ...catalog.extras]),
        facets: catalog.facets,
        lines: catalog.lines,
      },
      {
        headers: {
          'Cache-Control': 'public, max-age=60, s-maxage=60, stale-while-revalidate=600',
        },
      },
    )
  } catch {
    return Response.json({ error: 'Каталог временно недоступен' }, { status: 503 })
  }
}
