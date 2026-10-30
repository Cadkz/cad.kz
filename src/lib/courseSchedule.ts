import type { Payload } from 'payload'
import {
  astanaToday,
  type CatalogCourse,
  type CourseGroup,
  type CourseProgram,
  matchPrograms,
  parseCsv,
  parseSchedule,
  programs,
  scheduleCsvUrl,
  upcoming,
} from '../domain/courseSchedule.mjs'
import { lpIdFromKey } from '../domain/courseSync.mjs'
import { syncCourses } from './courseSync'
import { productPath } from './productPath'
import { refreshSiteData } from './siteCache'

/**
 * Расписание курсов из Google Таблицы УЦ (src/domain/courseSchedule.mjs). Таблица читается раз
 * в сутки по расписанию (vercel.json → /api/cron/course-schedule, 02:37 по Астане — не вместе
 * с архивом аналитики) и кнопкой «Прочитать сейчас» в админке (решение владельца 30.10.2026:
 * «максимум раз в день»). Прочитанное хранится в базе (integrations, course-schedule); страницы
 * сайта таблицу не ждут — берут эту копию (одна строка из базы), в памяти сервера — 10 минут. Google не ответил —
 * остаётся прежняя копия, ближайшие группы не пропадают. После каждого удачного чтения — цены
 * курсов и новые курсы по таблице (src/lib/courseSync.ts).
 */
const STATE_KEY = 'course-schedule'
const MEMORY_MS = 10 * 60_000
const FETCH_MS = 8000
const options = { overrideAccess: true, depth: 0 } as const

export type Schedule = {
  groups: CourseGroup[]
  /** Когда таблица прочитана, ISO; null — ни разу. */
  fetchedAt: string | null
  /** Ошибка последнего чтения, если показана сохранённая копия. */
  error: string | null
}

type Stored = { groups: CourseGroup[]; fetchedAt: string; error?: string | null }

let memory: { value: Schedule; at: number } | null = null
let running: Promise<Schedule> | null = null

function isStored(value: unknown): value is Stored {
  const state = value as Stored | null
  return Boolean(state) && Array.isArray(state?.groups) && typeof state?.fetchedAt === 'string'
}

async function loadSaved(payload: Payload) {
  const { docs } = await payload.find({
    collection: 'integrations',
    where: { key: { equals: STATE_KEY } },
    limit: 1,
    ...options,
  })
  const doc = docs[0]
  return doc && isStored(doc.state) ? { id: doc.id, state: doc.state } : null
}

async function save(payload: Payload, state: Stored) {
  const saved = await loadSaved(payload).catch(() => null)
  if (saved) {
    await payload.update({ collection: 'integrations', id: saved.id, data: { state }, ...options })
    return
  }
  await payload.create({ collection: 'integrations', data: { key: STATE_KEY, state }, ...options })
}

/** Прочитать таблицу. Ошибку — словами для админки. */
async function download(): Promise<CourseGroup[]> {
  const url = scheduleCsvUrl(process.env.COURSE_SCHEDULE_URL)
  let response: Response
  try {
    response = await fetch(url, {
      redirect: 'follow',
      cache: 'no-store',
      signal: AbortSignal.timeout(FETCH_MS),
    })
  } catch {
    throw new Error('Google Таблица не ответила вовремя')
  }
  const type = response.headers.get('content-type') ?? ''
  if (!response.ok || /text\/html/i.test(type))
    throw new Error(
      'Таблица закрыта: в Google Таблице «Настройки доступа» → «Все, у кого есть ссылка» → «Читатель»',
    )
  const groups = parseSchedule(parseCsv(await response.text()))
  if (!groups)
    throw new Error('В таблице нет строки с колонками «Наименование курса» и «Дата начала»')
  return groups
}

/**
 * Прочитать таблицу сейчас (расписание раз в сутки и кнопка в админке): сохранить копию, обновить
 * цены и курсы. Не прочиталась — в копии остаются прежние группы и пишется ошибка.
 */
export async function readScheduleNow(payload: Payload): Promise<Schedule> {
  const saved = await loadSaved(payload).catch(() => null)
  let value: Schedule
  try {
    const groups = await download()
    value = { groups, fetchedAt: new Date().toISOString(), error: null }
  } catch (error) {
    value = {
      groups: saved?.state.groups ?? [],
      fetchedAt: saved?.state.fetchedAt ?? null,
      error: error instanceof Error ? error.message : 'ошибка чтения',
    }
  }
  if (value.fetchedAt)
    await save(payload, { groups: value.groups, fetchedAt: value.fetchedAt, error: value.error })
  if (!value.error) await syncCourses(payload, value.groups)
  memory = { value, at: Date.now() }
  // Ближайшие старты есть в каталоге: кэш сайта — заново (src/lib/siteCache.ts).
  refreshSiteData()
  return value
}

/**
 * Сохранённая копия расписания из базы; в памяти сервера — 10 минут. Таблицу не читает.
 * fresh — мимо памяти (админка: копию могли обновить в другой копии сайта).
 */
export async function loadSchedule(payload: Payload, { fresh = false } = {}): Promise<Schedule> {
  if (!fresh && memory && Date.now() - memory.at < MEMORY_MS) return memory.value
  if (fresh) running = null
  running ??= loadSaved(payload)
    .catch(() => null)
    .then((saved) => {
      const value: Schedule = saved
        ? {
            groups: saved.state.groups,
            fetchedAt: saved.state.fetchedAt,
            error: saved.state.error ?? null,
          }
        : { groups: [], fetchedAt: null, error: null }
      memory = { value, at: Date.now() }
      return value
    })
    .finally(() => {
      running = null
    })
  return running
}

export type CourseCard = {
  id: number
  title: string
  href: string
  aliases: string[]
  /** Номер программы l-p.kz, если курс завёл сайт по таблице. */
  lpId: string | null
}

/** Опубликованные курсы каталога: название, «Другие названия», адрес. */
export async function catalogCourses(payload: Payload): Promise<CourseCard[]> {
  const { docs } = await payload.find({
    collection: 'products',
    where: { and: [{ kind: { equals: 'course' } }, { status: { equals: 'published' } }] },
    pagination: false,
    depth: 0,
    select: { title: true, slug: true, legacyUrl: true, searchAliases: true, legacyKey: true },
  })
  return docs.map((doc) => ({
    id: doc.id,
    title: doc.title,
    href: productPath(doc),
    lpId: lpIdFromKey(doc.legacyKey),
    aliases: (doc.searchAliases ?? '')
      .split(/[,;\n]/)
      .map((alias) => alias.trim())
      .filter(Boolean),
  }))
}

export type CourseMatches = {
  schedule: Schedule
  today: string
  programs: (CourseProgram & { courseId: number | null; score: number })[]
  courses: CourseCard[]
}

/** Расписание, сопоставленное с курсами каталога. */
export async function courseMatches(
  payload: Payload,
  { fresh = false } = {},
): Promise<CourseMatches> {
  const [schedule, courses] = await Promise.all([
    loadSchedule(payload, { fresh }),
    catalogCourses(payload),
  ])
  const today = astanaToday()
  const catalog: CatalogCourse[] = courses.map(({ id, title, aliases, lpId }) => ({
    id,
    title,
    aliases,
    lpId,
  }))
  const matched = matchPrograms(programs(schedule.groups, today), catalog)
  return {
    schedule,
    today,
    programs: matched.map(({ program, courseId, score }) => ({ ...program, courseId, score })),
    courses,
  }
}

/** Ближайшие группы курса каталога (все курсы расписания, сопоставленные с ним), по дате. */
export function groupsForCourse(matches: CourseMatches, courseId: number) {
  return upcoming(
    matches.programs.filter((p) => p.courseId === courseId).flatMap((p) => p.groups),
    matches.today,
  )
}
