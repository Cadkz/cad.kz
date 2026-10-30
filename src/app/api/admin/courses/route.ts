import { scheduleReport } from '@/domain/courseSchedule.mjs'
import { logActivity } from '@/lib/activity'
import { adminRequest, reply } from '@/lib/adminApi'
import { courseMatches } from '@/lib/courseSchedule'

/**
 * Действия страницы «Расписание курсов» (администратор и маркетолог): скрыть курсы, которых нет
 * в расписании УЦ, и взять цены курсов из таблицы. Списки и цены сервер считает сам по свежей
 * сверке: из браузера берутся только отмеченные ID.
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
  const chosen = new Set(ids(data.ids))
  if (!chosen.size) return reply({ error: 'Ничего не отмечено' }, 400)
  const matches = await courseMatches(payload)
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

  if (data.action === 'prices') {
    const rows = report.linked.filter((row) => chosen.has(row.course.id) && row.price)
    const done: string[] = []
    const skipped: string[] = []
    for (const row of rows) {
      const { docs } = await payload.find({
        collection: 'offers',
        where: {
          and: [{ product: { equals: row.course.id } }, { status: { equals: 'published' } }],
        },
        pagination: false,
        ...opts,
      })
      const amount = row.price ?? ''
      // Цена курса — одна; у курса с несколькими комплектациями решает менеджер в «Ценах».
      if (docs.length > 1) {
        skipped.push(row.course.title)
        continue
      }
      const priceData = { amount, currency: 'KZT' as const, includesVat: true, sourceVat: '16' }
      const offer = docs[0]
      if (offer)
        await payload.update({ collection: 'offers', id: offer.id, data: priceData, ...opts })
      else
        await payload.create({
          collection: 'offers',
          data: {
            title: `${row.course.title} — Обучение одного слушателя`,
            status: 'published',
            product: row.course.id,
            configuration: 'Обучение одного слушателя',
            license: 'Онлайн-курс',
            ...priceData,
          },
          ...opts,
        })
      done.push(row.course.title)
    }
    await logActivity(payload, {
      action: 'prices',
      summary: `Цены курсов из расписания УЦ: ${done.length}`,
      userId: user.id,
      link: '/admin/courses',
      details: { done, skipped },
    })
    const rest = skipped.length
      ? ` Не тронуты (несколько комплектаций, правьте в «Ценах»): ${skipped.join('; ')}.`
      : ''
    return reply({ message: `Цены обновлены у курсов: ${done.length}.${rest}` })
  }

  return reply({ error: 'Неизвестное действие' }, 400)
}
