import config from '@payload-config'
import { getPayload } from 'payload'
import { readScheduleNow } from '@/lib/courseSchedule'

export const maxDuration = 60

/**
 * Чтение таблицы «Расписание курсов» УЦ по расписанию (vercel.json → crons, раз в сутки в 21:37
 * UTC = 02:37 по Астане; архив аналитики — в 03:17 UTC, на час с запасом не пересекаются).
 * Вместе с чтением сайт обновляет цены курсов и заводит новые (src/lib/courseSync.ts).
 * Vercel присылает Authorization: Bearer <CRON_SECRET>; без секрета или с чужим — отказ.
 */
export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET?.trim()
  if (!secret) return Response.json({ error: 'CRON_SECRET не задан' }, { status: 503 })
  if (request.headers.get('authorization') !== `Bearer ${secret}`)
    return Response.json({ error: 'Нет доступа' }, { status: 401 })
  const payload = await getPayload({ config })
  const schedule = await readScheduleNow(payload)
  if (schedule.error) console.error('Расписание курсов по расписанию:', schedule.error)
  return Response.json(
    { fetchedAt: schedule.fetchedAt, groups: schedule.groups.length, error: schedule.error },
    { headers: { 'Cache-Control': 'no-store' } },
  )
}
