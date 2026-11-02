import type { Payload, Where } from 'payload'
import { listingCovers, listingFor, listingPage } from '../domain/legacyCovers.mjs'
import { mediaFor, oldSite } from './legacyContentRun'
import { relId } from './rel'

/**
 * Обложки публикаций — картинки анонса со старого cad.kz (замечание владельца 02.11.2026).
 * Берутся статьи и акции без обложки, а также все публикации с 01.09.2026 (у новых обложкой
 * стоял обрезанный скриншот из текста). Новые — первыми. За сборку — не дольше WORK_MS;
 * не успели — следующая сборка продолжит. Отметка «готово» — когда прошли всех.
 */
export const LEGACY_COVERS_KEY = 'catalog-setup:legacy-covers-2026-11-02'
const WORK_MS = 150_000
const RECENT = '2026-09-01T00:00:00.000Z'
const MAX_PAGES = 40
const PARALLEL = 4
const opts = { overrideAccess: true, depth: 0 } as const

type Target = { id: number; title: string; legacyUrl: string; cover: number | null }

async function targets(payload: Payload): Promise<Target[]> {
  const where: Where = {
    and: [
      { status: { equals: 'published' } },
      { legacyUrl: { exists: true } },
      {
        or: [
          { and: [{ kind: { in: ['article', 'promotion'] } }, { cover: { exists: false } }] },
          { publishedAt: { greater_than_equal: RECENT } },
        ],
      },
    ],
  }
  const { docs } = await payload.find({
    collection: 'publications',
    where,
    sort: '-publishedAt',
    pagination: false,
    select: { title: true, legacyUrl: true, cover: true },
    ...opts,
  })
  return docs.flatMap((doc) =>
    doc.legacyUrl && listingFor(doc.legacyUrl)
      ? [{ id: doc.id, title: doc.title, legacyUrl: doc.legacyUrl, cover: relId(doc.cover) }]
      : [],
  )
}

/** Листаем списки старого сайта, пока не найдём все нужные адреса или страницы не кончатся. */
async function findCovers(needed: Set<string>, deadline: number) {
  const covers = new Map<string, string>()
  const bases = [...new Set([...needed].map((path) => listingFor(path)))].filter(
    (base): base is string => Boolean(base),
  )
  for (const base of bases) {
    const seen = new Set<string>()
    for (let page = 1; page <= MAX_PAGES && Date.now() < deadline; page++) {
      const response = await fetch(`${oldSite()}${listingPage(base, page)}`, {
        signal: AbortSignal.timeout(15_000),
        headers: { 'user-agent': 'cad.kz-migration' },
      })
      if (!response.ok) break
      const found = listingCovers(await response.text())
      const fresh = [...found].filter(([path]) => !seen.has(path))
      if (!fresh.length) break
      for (const [path, src] of fresh) {
        seen.add(path)
        if (needed.has(path)) covers.set(path, src)
      }
      if ([...needed].every((path) => listingFor(path) !== base || covers.has(path))) break
    }
  }
  return covers
}

/** Сбой сети или старого сайта не роняет сборку: отчёт с причиной, следующая сборка повторит. */
export async function setupLegacyCovers(payload: Payload): Promise<string[] | null> {
  try {
    return await run(payload)
  } catch (error) {
    return [`Обложки не поставлены: ${error instanceof Error ? error.message : 'ошибка'}`]
  }
}

async function run(payload: Payload): Promise<string[] | null> {
  const done = await payload.find({
    collection: 'import-runs',
    where: { idempotencyKey: { equals: LEGACY_COVERS_KEY } },
    limit: 1,
    ...opts,
  })
  if (done.docs.length) return null
  const deadline = Date.now() + WORK_MS
  const list = await targets(payload)
  const covers = await findCovers(new Set(list.map((t) => t.legacyUrl)), deadline)
  let set = 0
  let same = 0
  const failed: string[] = []
  const queue = list.filter((t) => covers.has(t.legacyUrl))
  let stopped = false
  const work = async () => {
    for (let item = queue.shift(); item; item = queue.shift()) {
      if (Date.now() > deadline) {
        stopped = true
        return
      }
      const src = covers.get(item.legacyUrl) ?? ''
      try {
        const { media } = await mediaFor(payload, `${oldSite()}${src}`, item.title)
        if (media.id === item.cover) {
          same++
          continue
        }
        await payload.update({
          collection: 'publications',
          id: item.id,
          data: { cover: media.id },
          ...opts,
        })
        set++
      } catch (error) {
        failed.push(`${item.title}: ${error instanceof Error ? error.message : 'ошибка'}`)
      }
    }
  }
  await Promise.all(Array.from({ length: PARALLEL }, work))
  const report = [
    `Обложки со старого сайта: поставлено ${set}, уже были ${same}, без картинки в списке ${list.length - covers.size}, не скачались ${failed.length}`,
    ...failed.slice(0, 10),
  ]
  if (stopped || Date.now() > deadline) report.push('Не успели всех — продолжит следующая сборка')
  else
    await payload.create({
      collection: 'import-runs',
      data: { idempotencyKey: LEGACY_COVERS_KEY, state: 'done', snapshot: { report } },
      ...opts,
    })
  return report
}
