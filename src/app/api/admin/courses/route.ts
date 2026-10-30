import { scheduleReport } from '@/domain/courseSchedule.mjs'
import { logActivity } from '@/lib/activity'
import { adminRequest, reply } from '@/lib/adminApi'
import { updateDescriptions } from '@/lib/coursePages'
import { courseMatches, readScheduleNow } from '@/lib/courseSchedule'

/**
 * Описания читаются со страниц l-p.kz порциями: браузер шлёт по DESCRIPTION_BATCH курсов, одна
 * порция — секунды, а не минута (36 курсов одним запросом не укладывались в лимит Vercel,
 * замечание владельца 31.10.2026).
 */
export const maxDuration = 60
const DESCRIPTION_BATCH = 3

/**
 * Действия страницы «Расписание курсов» (администратор и маркетолог): скрыть курсы, которых нет
 * в расписании УЦ, и обновить описания курсов со страниц l-p.kz. Цены сайт берёт из таблицы сам
 * при каждом чтении (src/lib/courseSync.ts). Списки и ссылки сервер считает сам по свежей сверке:
 * из браузера берутся только отмеченные ID.
 */
const opts = { overrideAccess: true, depth: 0 } as const

function ids(value: unknown) {
  return Array.isArray(value)
    ? value.filter((id): id is number => Number.isSafeInteger(id) && id > 0).slice(0, 200)
    : []
}

export async function POST(request: Request) {
  const checked = await adminRequest(request, 20_000, ['admin', 'editor'])
  if ('error' in checked) return checked.error
  const { payload, data, user } = checked
  if (data.action === 'read') {
    const schedule = await readScheduleNow(payload)
    return schedule.error
      ? reply({ error: `Таблица не прочиталась: ${schedule.error}` }, 502)
      : reply({ message: `Таблица прочитана, запусков: ${schedule.groups.length}.` })
  }
  const chosen = new Set(ids(data.ids))
  if (!chosen.size) return reply({ error: 'Ничего не отмечено' }, 400)
  const matches = await courseMatches(payload, { fresh: true })
  if (!matches.schedule.fetchedAt)
    return reply({ error: 'Таблица расписания не читается — сначала откройте к ней доступ' }, 409)
  const report = scheduleReport(matches.programs, matches.courses, matches.today)

  if (data.action === 'hide') {
    const hide = report.extra.filter((course) => chosen.has(course.id))
    for (const course of hide)
      await payload.update({
        collection: 'products',
        id: course.id,
        data: { status: 'draft' },
        ...opts,
      })
    await logActivity(payload, {
      action: 'delete',
      summary: `Курсы в черновики (нет в расписании УЦ): ${hide.map((c) => c.title).join('; ')}`,
      userId: user.id,
      link: '/admin/courses',
    })
    return reply({ message: `Скрыто курсов: ${hide.length}. Вернуть — «Активность» → «Да».` })
  }

  if (data.action === 'descriptions') {
    const batch = [...chosen].slice(0, DESCRIPTION_BATCH)
    const result = await updateDescriptions(payload, matches, batch)
    if (result.done.length)
      await logActivity(payload, {
        action: 'import',
        summary: `Описания курсов с l-p.kz: ${result.done.join('; ')}`,
        userId: user.id,
        link: '/admin/courses',
        details: { ...result },
      })
    return reply({ message: '', ...result })
  }

  return reply({ error: 'Неизвестное действие' }, 400)
}
