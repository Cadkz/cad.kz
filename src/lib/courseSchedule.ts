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
import { productPath } from './productPath'

/**
 * Расписание курсов из Google Таблицы УЦ (src/domain/courseSchedule.mjs). Таблица читается не чаще
 * раза в 10 минут на сервер; страница не ждёт таблицу, если есть прежняя копия, — обновление идёт
 * фоном. Последняя удачная копия хранится в базе (integrations, course-schedule): Google не
 * ответил — сайт показывает её, и ближайшие группы не пропадают.
 */
const STATE_KEY = 'course-schedule'
const FRESH_MS = 10 * 60_000
const FETCH_MS = 6000
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
    // Не переписывать базу, если таблица не менялась.
    const same =
      JSON.stringify(saved.state.groups) === JSON.stringify(state.groups) &&
      (saved.state.error ?? null) === (state.error ?? null)
    if (!same)
      await payload.update({
        collection: 'integrations',
        id: saved.id,
        data: { state },
        ...options,
      })
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

async function refresh(payload: Payload): Promise<Schedule> {
  try {
    const groups = await download()
    const value = { groups, fetchedAt: new Date().toISOString(), error: null }
    await save(payload, value).catch((error) =>
      console.error('Расписание курсов: не сохранилось', error instanceof Error ? error.name : ''),
    )
    return value
  } catch (error) {
    const message = error instanceof Error ? error.message : 'ошибка чтения'
    const saved = await loadSaved(payload).catch(() => null)
    return {
      groups: saved?.state.groups ?? [],
      fetchedAt: saved?.state.fetchedAt ?? null,
      error: message,
    }
  }
}

/**
 * Расписание: из памяти, если ему меньше 10 минут; старое — сразу, с обновлением фоном; при
 * первом обращении — ждём таблицу (до 6 с), иначе сохранённая копия. fresh — для кнопки
 * «Обновить сейчас» в админке.
 */
export async function loadSchedule(payload: Payload, { fresh = false } = {}): Promise<Schedule> {
  const now = Date.now()
  if (!fresh && memory && now - memory.at < FRESH_MS) return memory.value
  const start = () => {
    running ??= refresh(payload)
      .then((value) => {
        memory = { value, at: Date.now() }
        return value
      })
      .finally(() => {
        running = null
      })
    return running
  }
  if (!fresh && memory) {
    void start()
    return memory.value
  }
  return start()
}

export type CourseCard = { id: number; title: string; href: string; aliases: string[] }

/** Опубликованные курсы каталога: название, «Другие названия», адрес. */
export async function catalogCourses(payload: Payload): Promise<CourseCard[]> {
  const { docs } = await payload.find({
    collection: 'products',
    where: { and: [{ kind: { equals: 'course' } }, { status: { equals: 'published' } }] },
    pagination: false,
    depth: 0,
    select: { title: true, slug: true, legacyUrl: true, searchAliases: true },
  })
  return docs.map((doc) => ({
    id: doc.id,
    title: doc.title,
    href: productPath(doc),
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
  const catalog: CatalogCourse[] = courses.map(({ id, title, aliases }) => ({ id, title, aliases }))
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
