import type { Payload } from 'payload'
import {
  astanaToday,
  type CourseGroup,
  matchPrograms,
  programs,
} from '../domain/courseSchedule.mjs'
import {
  COURSE_OFFER,
  type CourseOffer,
  courseSlug,
  lpIdFromKey,
  planCourseSync,
} from '../domain/courseSync.mjs'
import { logActivity } from './activity'
import { relId } from './rel'

/**
 * Курсы сайта по таблице УЦ (просьба владельца 30.10.2026, вечер): после каждого удачного чтения
 * таблицы (src/lib/courseSchedule.ts) цены курсов становятся как в таблице, а курсы, которых на
 * сайте нет, заводятся. План — src/domain/courseSync.mjs. Что поменялось в последний раз —
 * запись integrations / course-sync, её показывает страница «Расписание курсов».
 */
const REPORT_KEY = 'course-sync'
const options = { overrideAccess: true, depth: 0 } as const
const PRICE = { currency: 'KZT' as const, includesVat: true, sourceVat: '16' }

export type SyncReport = {
  /** Когда сайт в последний раз что-то поменял по таблице, ISO. */
  at: string
  prices: { title: string; before: string | null; amount: string }[]
  created: { id: number; title: string }[]
  skipped: string[]
  errors: string[]
}

/** Все курсы сайта, в том числе скрытые: скрытый по таблице второй раз не заводится. */
async function allCourses(payload: Payload) {
  const { docs } = await payload.find({
    collection: 'products',
    where: { kind: { equals: 'course' } },
    pagination: false,
    select: {
      title: true,
      status: true,
      slug: true,
      legacyKey: true,
      searchAliases: true,
      manufacturer: true,
    },
    ...options,
  })
  return docs
}

/** Производитель новых курсов — как у большинства курсов сайта (учебный центр CAD.kz). */
function usualVendor(courses: { manufacturer?: unknown; status?: string | null }[]) {
  const counts = new Map<number, number>()
  for (const course of courses) {
    const id = relId(course.manufacturer as number | { id: number } | null | undefined)
    if (id != null && course.status === 'published') counts.set(id, (counts.get(id) ?? 0) + 1)
  }
  return [...counts.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] ?? null
}

async function courseOffers(payload: Payload, ids: number[]) {
  const map = new Map<number, CourseOffer[]>()
  if (!ids.length) return map
  const { docs } = await payload.find({
    collection: 'offers',
    where: { and: [{ product: { in: ids } }, { status: { equals: 'published' } }] },
    pagination: false,
    select: { product: true, amount: true, currency: true, includesVat: true },
    ...options,
  })
  for (const offer of docs) {
    const product = relId(offer.product)
    if (product == null) continue
    map.set(product, [...(map.get(product) ?? []), offer])
  }
  return map
}

/** Свободный адрес: занят — с номером программы l-p.kz. */
function freeSlug(title: string, key: string, taken: Set<string>) {
  const base = courseSlug(title)
  const slug = taken.has(base) ? `${base}-${key.replace(/\D/g, '')}` : base
  taken.add(slug)
  return slug
}

async function saveReport(payload: Payload, report: SyncReport) {
  const { docs } = await payload.find({
    collection: 'integrations',
    where: { key: { equals: REPORT_KEY } },
    limit: 1,
    ...options,
  })
  const doc = docs[0]
  if (doc)
    await payload.update({
      collection: 'integrations',
      id: doc.id,
      data: { state: report },
      ...options,
    })
  else
    await payload.create({
      collection: 'integrations',
      data: { key: REPORT_KEY, state: report },
      ...options,
    })
}

/** Последние изменения по таблице — для страницы «Расписание курсов». */
export async function lastSync(payload: Payload): Promise<SyncReport | null> {
  const { docs } = await payload.find({
    collection: 'integrations',
    where: { key: { equals: REPORT_KEY } },
    limit: 1,
    ...options,
  })
  const state = docs[0]?.state as SyncReport | undefined
  return state && typeof state.at === 'string' ? state : null
}

/**
 * Цены и новые курсы по таблице. Пишет в базу только то, что отличается: таблица не менялась —
 * запросов на запись нет. Ошибка одного курса не останавливает остальные.
 */
export async function syncCourses(payload: Payload, groups: CourseGroup[]): Promise<SyncReport> {
  const today = astanaToday()
  const courses = await allCourses(payload)
  const catalog = courses.map((course) => ({
    id: course.id,
    title: course.title,
    lpId: lpIdFromKey(course.legacyKey),
    aliases: (course.searchAliases ?? '')
      .split(/[,;\n]/)
      .map((alias) => alias.trim())
      .filter(Boolean),
  }))
  const matched = matchPrograms(programs(groups, today), catalog).map(({ program, courseId }) => ({
    ...program,
    courseId,
  }))
  const plan = planCourseSync({
    programs: matched,
    courses,
    offers: await courseOffers(
      payload,
      courses.map((course) => course.id),
    ),
    today,
  })
  const report: SyncReport = {
    at: new Date().toISOString(),
    prices: [],
    created: [],
    skipped: plan.skipped,
    errors: [],
  }

  for (const change of plan.prices) {
    try {
      if (change.offerId != null)
        await payload.update({
          collection: 'offers',
          id: change.offerId,
          data: { amount: change.amount, ...PRICE },
          ...options,
        })
      else
        await payload.create({
          collection: 'offers',
          data: {
            title: `${change.title} — ${COURSE_OFFER.configuration}`,
            status: 'published',
            product: change.productId,
            ...COURSE_OFFER,
            amount: change.amount,
            ...PRICE,
          },
          ...options,
        })
      report.prices.push({ title: change.title, before: change.before, amount: change.amount })
    } catch {
      report.errors.push(`цена: ${change.title}`)
    }
  }

  const vendor = usualVendor(courses)
  const taken = new Set(courses.map((course) => course.slug))
  for (const { program, key } of plan.create) {
    try {
      const product = await payload.create({
        collection: 'products',
        data: {
          title: program.title,
          kind: 'course',
          status: 'published',
          slug: freeSlug(program.title, key, taken),
          legacyKey: key,
          pageView: 'standard',
          manufacturer: vendor,
          // Другие написания из таблицы — чтобы сверка и поиск узнавали курс.
          searchAliases: program.titles.filter((title) => title !== program.title).join(', '),
        },
        ...options,
      })
      if (program.price)
        await payload.create({
          collection: 'offers',
          data: {
            title: `${program.title} — ${COURSE_OFFER.configuration}`,
            status: 'published',
            product: product.id,
            ...COURSE_OFFER,
            amount: program.price,
            ...PRICE,
          },
          ...options,
        })
      report.created.push({ id: product.id, title: program.title })
    } catch {
      // Чаще всего — тот же курс уже завёл соседний запрос (ключ импорта уникален).
      report.errors.push(`новый курс: ${program.title}`)
    }
  }

  if (report.prices.length || report.created.length) {
    await saveReport(payload, report).catch(() => undefined)
    await logActivity(payload, {
      action: 'prices',
      summary:
        `Курсы по расписанию УЦ: цены — ${report.prices.length}, заведено — ` +
        `${report.created.length}`,
      link: '/admin/courses',
      details: { prices: report.prices, created: report.created, skipped: report.skipped },
    })
  }
  return report
}
