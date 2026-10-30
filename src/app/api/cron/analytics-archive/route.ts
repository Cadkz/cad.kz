import config from '@payload-config'
import { getPayload } from 'payload'
import { runScheduledArchive } from '@/lib/analyticsArchive'

export const maxDuration = 60

/**
 * Проверка по расписанию (vercel.json → crons, раз в сутки): пора ли отправлять архив аналитики
 * администраторам. Vercel присылает заголовок Authorization: Bearer <CRON_SECRET>; без секрета
 * или с чужим — отказ, чтобы адрес нельзя было дёргать снаружи.
 */
export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET?.trim()
  if (!secret) return Response.json({ error: 'CRON_SECRET не задан' }, { status: 503 })
  if (request.headers.get('authorization') !== `Bearer ${secret}`)
    return Response.json({ error: 'Нет доступа' }, { status: 401 })
  const payload = await getPayload({ config })
  const result = await runScheduledArchive(payload)
  if ('error' in result) console.error('Архив аналитики по расписанию:', result.error)
  return Response.json(result, { headers: { 'Cache-Control': 'no-store' } })
}
