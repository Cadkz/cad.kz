import type { Payload } from 'payload'
import { parseCoursePage } from '../domain/lpCoursePage.mjs'
import type { CourseMatches } from './courseSchedule'

/**
 * Описания курсов со страниц учебного центра l-p.kz (просьба владельца 30.10.2026, вечер):
 * кнопка на странице «Расписание курсов». Страницу читает сервер сайта по ссылке из колонки
 * «Программа курса» таблицы УЦ, разбор — src/domain/lpCoursePage.mjs. Описание заменяется целиком,
 * «Коротко для карточки» заполняется, только если пусто (его правят руками), длительность —
 * строкой «Длительность» в характеристиках, если её нет.
 */
const FETCH_MS = 15_000
/** Позже этого сохранять не начинаем: ответ должен уйти раньше, чем Vercel оборвёт запрос (60 с). */
const SAVE_UNTIL_MS = 30_000
const SAVE_MS = 20_000
const options = { overrideAccess: true, depth: 0 } as const

/** Только страницы самого l-p.kz: адрес берётся из таблицы, на чужие сайты сервер не ходит. */
export function lpUrl(link: string) {
  try {
    const url = new URL(link)
    return /^https?:$/.test(url.protocol) && /^(www\.)?l-p\.kz$/i.test(url.hostname)
      ? url.toString()
      : null
  } catch {
    return null
  }
}

/** Страница как текст: кодировка из ответа (у Битрикса бывает windows-1251), иначе UTF-8. */
async function download(url: string) {
  const response = await fetch(url, {
    redirect: 'follow',
    cache: 'no-store',
    signal: AbortSignal.timeout(FETCH_MS),
    headers: { 'user-agent': 'CAD.kz site (course descriptions)' },
  })
  if (!response.ok) throw new Error(`l-p.kz ответил ${response.status}`)
  const bytes = await response.arrayBuffer()
  const type = response.headers.get('content-type') ?? ''
  const head = new TextDecoder('latin1').decode(bytes.slice(0, 2048))
  const charset =
    /charset=["']?([\w-]+)/i.exec(type)?.[1] ?? /charset=["']?([\w-]+)/i.exec(head)?.[1]
  try {
    return new TextDecoder(charset ?? 'utf-8').decode(bytes)
  } catch {
    return new TextDecoder('utf-8').decode(bytes)
  }
}

/** done — названия обновлённых курсов, failed — «название — причина», doneIds / failedIds — их ID. */
export type DescriptionResult = {
  done: string[]
  failed: string[]
  doneIds: number[]
  failedIds: number[]
}

/** Ссылка на программу курса l-p.kz для курса сайта: первая из сопоставленных строк таблицы. */
export function courseLinks(matches: CourseMatches) {
  const links = new Map<number, string>()
  for (const program of matches.programs) {
    const url = program.courseId == null ? null : lpUrl(program.link)
    if (url && program.courseId != null && !links.has(program.courseId))
      links.set(program.courseId, url)
  }
  return links
}

type CoursePage = NonNullable<ReturnType<typeof parseCoursePage>>

/** Сохранение не дольше SAVE_MS: зависло — ответить браузеру причиной, а не ждать обрыва. */
function inTime<T>(work: Promise<T>) {
  let timer: ReturnType<typeof setTimeout> | undefined
  const stop = new Promise<never>((_, reject) => {
    timer = setTimeout(() => reject(new Error('база не ответила за 20 с')), SAVE_MS)
  })
  return Promise.race([work, stop]).finally(() => clearTimeout(timer))
}

async function save(payload: Payload, id: number, page: CoursePage) {
  const product = await payload.findByID({ collection: 'products', id, ...options })
  const properties = product.properties ?? []
  const hasHours = properties.some((row) => /длительн/i.test(row.name))
  await payload.update({
    collection: 'products',
    id,
    data: {
      description: page.description,
      ...(product.summary?.trim() || !page.summary ? {} : { summary: page.summary }),
      ...(page.hours && !hasHours
        ? { properties: [{ name: 'Длительность', value: page.hours }, ...properties] }
        : {}),
    },
    ...options,
  })
  return product.title
}

function reason(error: unknown) {
  if (error instanceof Error && error.name === 'TimeoutError') return 'l-p.kz не ответил вовремя'
  if (error instanceof TypeError) return 'страница l-p.kz не открылась'
  return error instanceof Error ? error.message : 'ошибка'
}

/** Описания отмеченных курсов (порция из браузера): ошибка одного не мешает остальным. */
export async function updateDescriptions(
  payload: Payload,
  matches: CourseMatches,
  ids: number[],
): Promise<DescriptionResult> {
  const links = courseLinks(matches)
  const titles = new Map(matches.courses.map((course) => [course.id, course.title]))
  const deadline = Date.now() + SAVE_UNTIL_MS
  const queue = ids.filter((id) => links.has(id))
  const result: DescriptionResult = { done: [], failed: [], doneIds: [], failedIds: [] }
  for (const id of ids.filter((id) => !links.has(id))) {
    result.failed.push(`${titles.get(id) ?? id} — в таблице УЦ нет ссылки на l-p.kz`)
    result.failedIds.push(id)
  }
  const fail = (id: number, why: string) => {
    result.failed.push(`${titles.get(id) ?? id} — ${why}`)
    result.failedIds.push(id)
  }
  // Страницы читаются параллельно, а сохраняются по одной: каждое сохранение — отдельная
  // транзакция и отдельное соединение с базой, а на Vercel соединений всего три.
  const pages = await Promise.all(
    queue.map(async (id) => {
      try {
        const page = parseCoursePage(await download(links.get(id) ?? ''))
        if (!page) throw new Error('на странице нет описания курса')
        return { id, page }
      } catch (error) {
        fail(id, reason(error))
        return null
      }
    }),
  )
  for (const item of pages) {
    if (!item) continue
    if (Date.now() > deadline) {
      fail(item.id, 'не успели сохранить — повторите')
      continue
    }
    try {
      result.done.push(await inTime(save(payload, item.id, item.page)))
      result.doneIds.push(item.id)
    } catch (error) {
      fail(item.id, `не сохранилось: ${reason(error)}`)
    }
  }
  return result
}
