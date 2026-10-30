import config from '@payload-config'
import { getPayload } from 'payload'
import { analyticsTables } from '@/domain/analyticsArchive.mjs'
import { periodKey, toCsv } from '@/domain/searchStats.mjs'
import { loadAnalytics } from '@/lib/analytics'

/**
 * Выгрузка таблицы страницы «Аналитика» для Excel: GET /api/admin/analytics?days=30&part=searches.
 * Таблицы те же, что в архиве на почту (analyticsTables) — все строки, без обрезки страницы.
 * Администратор и маркетолог (по входу в админку).
 */
export async function GET(request: Request) {
  const payload = await getPayload({ config })
  const { user } = await payload.auth({ headers: request.headers })
  if (!user || (user.role !== 'admin' && user.role !== 'editor'))
    return new Response('Нет доступа. Войдите в админку.', { status: 403 })
  const url = new URL(request.url)
  const part = url.searchParams.get('part') ?? ''
  const period = periodKey(url.searchParams.get('days'))
  const data = await loadAnalytics(payload, period)
  const table = analyticsTables(data.searches, data.kaddi).find((t) => t.part === part)
  if (!table) return new Response('Неизвестная таблица', { status: 400 })
  const day = new Date().toISOString().slice(0, 10)
  return new Response(toCsv(table.header, table.rows), {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="${table.file}-${period}d-${day}.csv"`,
      'Cache-Control': 'no-store',
    },
  })
}
