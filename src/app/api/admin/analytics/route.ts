import config from '@payload-config'
import { getPayload } from 'payload'
import { periodKey, toCsv } from '@/domain/searchStats.mjs'
import { type Analytics, loadAnalytics } from '@/lib/analytics'

type Table = { name: string; header: string[]; rows: (string | number | null)[][] }

const clickName = (click: string | null) =>
  click === 'kaddi' ? 'Кадди' : click === 'whatsapp' ? 'WhatsApp' : click

/** Таблицы выгрузки: имя файла, шапка, строки — все, без обрезки страницы. */
const TABLES: Record<string, (data: Analytics) => Table> = {
  searches: ({ searches }) => ({
    name: 'zaprosy-poiska',
    header: ['Запрос', 'Раз', 'Нашлось', 'Переходов', 'Куда чаще'],
    rows: searches.top.map((s) => [s.query, s.count, s.found, s.clicks, clickName(s.top)]),
  }),
  empty: ({ searches }) => ({
    name: 'nichego-ne-nashlos',
    header: ['Запрос', 'Раз'],
    rows: searches.empty.map((s) => [s.query, s.count]),
  }),
  'kaddi-questions': ({ kaddi }) => ({
    name: 'voprosy-kaddi',
    header: ['Вопрос', 'Раз'],
    rows: kaddi.questions.map((q) => [q.text, q.count]),
  }),
  handoffs: ({ kaddi }) => ({
    name: 'peredano-menedzheru',
    header: ['Когда', 'Первый вопрос', 'Заявка', 'Разговор №'],
    rows: kaddi.handedOff.map((h) => [h.at, h.question, h.number, h.id]),
  }),
  unknown: ({ kaddi }) => ({
    name: 'kaddi-ne-znal',
    header: ['Когда', 'Вопрос', 'Ответ Кадди', 'Разговор №'],
    rows: kaddi.unknown.map((u) => [u.at, u.question, u.reply, u.id]),
  }),
}

/**
 * Выгрузка таблицы страницы «Аналитика» для Excel: GET /api/admin/analytics?days=30&part=searches.
 * Администратор и маркетолог (по входу в админку).
 */
export async function GET(request: Request) {
  const payload = await getPayload({ config })
  const { user } = await payload.auth({ headers: request.headers })
  if (!user || (user.role !== 'admin' && user.role !== 'editor'))
    return new Response('Нет доступа. Войдите в админку.', { status: 403 })
  const url = new URL(request.url)
  const build = TABLES[url.searchParams.get('part') ?? '']
  if (!build) return new Response('Неизвестная таблица', { status: 400 })
  const period = periodKey(url.searchParams.get('days'))
  const table = build(await loadAnalytics(payload, period))
  const day = new Date().toISOString().slice(0, 10)
  return new Response(toCsv(table.header, table.rows), {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="${table.name}-${period}d-${day}.csv"`,
      'Cache-Control': 'no-store',
    },
  })
}
