import config from '@payload-config'
import { getPayload } from 'payload'
import { adminRequest, reply } from '@/lib/adminApi'
import { buildArchive, sendArchive } from '@/lib/analyticsArchive'

/** Сборка архива за 4 месяца с запасом: дольше функции Vercel по умолчанию. */
export const maxDuration = 60

/** Самый длинный период для скачивания: столько хранятся запросы поиска, плюс запас. */
const MAX_DAYS = 200

/**
 * Архив аналитики, только администратор: в архиве разговоры Кадди с вопросами клиентов.
 * POST { action: 'send' } — «Отправить архив сейчас» на странице «Аналитика».
 */
export async function POST(request: Request) {
  const checked = await adminRequest(request, 200)
  if ('error' in checked) return checked.error
  if (checked.data.action !== 'send') return reply({ error: 'Неизвестный шаг' }, 400)
  const result = await sendArchive(checked.payload)
  if (!result.ok) return reply({ error: result.error }, result.status)
  return reply({ message: result.message, details: result.details })
}

function parseDate(value: string | null) {
  if (!value) return null
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? null : date
}

/**
 * GET ?from=…&to=… — скачать архив за период: ссылка из письма, когда архив не влез во вложение,
 * и кнопка «Скачать архив» на странице «Аналитика».
 */
export async function GET(request: Request) {
  const payload = await getPayload({ config })
  const { user } = await payload.auth({ headers: request.headers })
  if (user?.role !== 'admin')
    return new Response('Архив доступен только администратору. Войдите в админку.', {
      status: 403,
    })
  const url = new URL(request.url)
  const from = parseDate(url.searchParams.get('from'))
  const to = parseDate(url.searchParams.get('to'))
  if (!from || !to || from >= to || to.getTime() - from.getTime() > MAX_DAYS * 86_400_000)
    return new Response('Неверный период архива.', { status: 400 })
  const archive = await buildArchive(payload, from.toISOString(), to.toISOString())
  return new Response(new Uint8Array(archive.zip), {
    headers: {
      'Content-Type': 'application/zip',
      'Content-Disposition': `attachment; filename="${archive.name}"`,
      'Cache-Control': 'no-store',
    },
  })
}
