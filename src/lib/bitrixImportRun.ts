import type { Payload } from 'payload'
import { fetchFile, importImages } from '@/domain/bitrixImages.mjs'
import {
  addResult,
  emptyResult,
  finishImport,
  startImport,
  writeOffers,
  writeProducts,
} from '@/domain/bitrixImport.mjs'
import { readItems, readKeys, readManufacturers } from '@/domain/bitrixImportInput.mjs'

/**
 * Запуск импорта из Битрикса со страницы админки. Браузер присылает план частями, сервер пишет
 * каждую часть за один запрос (у функции на хостинге лимит времени) и ведёт запись в журнале
 * «Запуски импорта»: сколько записано, итог и замечания. Повтор части безопасен.
 */

/** Сколько секунд один запрос пишет в базу, прежде чем вернуть управление браузеру. */
const WRITE_SECONDS = 20
/** Если запуск не продвигался столько минут, страницу закрыли: можно начинать новый. */
const STALE_MINUTES = 5
/** В журнале храним не больше стольких замечаний и ошибок картинок. */
const KEEP_ISSUES = 500

export const PART_LIMITS = { product: 60, offer: 150, image: 20 } as const

type Counter = { created: number; updated: number; unchanged: number; unpublished: number }
type WriteResult = {
  manufacturers: Counter
  products: Counter
  offers: Counter
  demoHidden: number
  rates: { currency: string; from: string | null; to: string }[]
  issues: { type: string; id: string; title: string; detail?: string }[]
}
type ImageFailure = { product: string; path: string; reason: string }
type ImageResult = {
  downloaded: number
  reused: number
  products: number
  failed: ImageFailure[]
  postponed: number
}

export type RunSnapshot = {
  source: 'admin-page'
  hideDemo: boolean
  startedBy: string
  planned: { products: number; offers: number }
  done: { products: number; offers: number }
  result: WriteResult
  images: ImageResult
}

export type RunReply =
  | { ok: true; runId: number | string; processed?: number; snapshot: RunSnapshot }
  | { ok: true; images: ImageResult }
  | { ok: false; status: number; error: string }

const fail = (status: number, error: string): RunReply => ({ ok: false, status, error })

const OPTS = { overrideAccess: true, depth: 0 } as const

function emptyImages(): ImageResult {
  return { downloaded: 0, reused: 0, products: 0, failed: [], postponed: 0 }
}

function count(value: unknown): number | null {
  return Number.isInteger(value) && Number(value) >= 0 && Number(value) <= 100_000
    ? Number(value)
    : null
}

function isSnapshot(value: unknown): value is RunSnapshot {
  return Boolean(value && typeof value === 'object' && 'source' in value && 'planned' in value)
}

async function loadRun(payload: Payload, runId: unknown) {
  if (typeof runId !== 'number' && typeof runId !== 'string') return null
  try {
    const run = await payload.findByID({ collection: 'import-runs', id: runId, ...OPTS })
    return isSnapshot(run.snapshot) && run.state === 'running'
      ? { id: run.id, snapshot: run.snapshot }
      : null
  } catch {
    return null
  }
}

const saveRun = (payload: Payload, id: number | string, snapshot: RunSnapshot, state = 'running') =>
  payload.update({ collection: 'import-runs', id, data: { snapshot, state }, ...OPTS })

function keepIssues(result: WriteResult) {
  result.issues = result.issues.slice(0, KEEP_ISSUES)
  return result
}

/** Начало: производители, скрытие демо, курсы. Второй запуск, пока идёт первый, не начинается. */
export async function startRun(payload: Payload, body: Record<string, unknown>, userId: string) {
  const makers = readManufacturers(body.manufacturers)
  if ('error' in makers) return fail(400, makers.error ?? 'Неверные данные')
  const planned = body.planned as Record<string, unknown> | undefined
  const products = count(planned?.products)
  const offers = count(planned?.offers)
  if (products === null || offers === null || products === 0)
    return fail(400, 'В плане импорта нет товаров')

  const since = new Date(Date.now() - STALE_MINUTES * 60_000).toISOString()
  const busy = await payload.find({
    collection: 'import-runs',
    where: { and: [{ state: { equals: 'running' } }, { updatedAt: { greater_than: since } }] },
    limit: 1,
    ...OPTS,
  })
  if (busy.docs.length)
    return fail(409, 'Импорт уже идёт в другой вкладке. Подождите его окончания или 5 минут.')

  const snapshot: RunSnapshot = {
    source: 'admin-page',
    hideDemo: body.hideDemo === true,
    startedBy: userId,
    planned: { products, offers },
    done: { products: 0, offers: 0 },
    result: emptyResult(),
    images: emptyImages(),
  }
  const run = await payload.create({
    collection: 'import-runs',
    data: { idempotencyKey: `bitrix:${new Date().toISOString()}`, snapshot, state: 'running' },
    ...OPTS,
  })
  try {
    addResult(
      snapshot.result,
      await startImport(payload, makers.items, { hideDemo: snapshot.hideDemo }),
    )
  } catch (error) {
    await saveRun(payload, run.id, snapshot, 'failed')
    throw error
  }
  await saveRun(payload, run.id, snapshot)
  return { ok: true, runId: run.id, snapshot } satisfies RunReply
}

/** Часть товаров или вариантов. processed — сколько записей части успели записать. */
export async function writePart(
  payload: Payload,
  kind: 'product' | 'offer',
  body: Record<string, unknown>,
) {
  const run = await loadRun(payload, body.runId)
  if (!run) return fail(409, 'Запуск импорта не найден или уже закончен. Начните заново.')
  const part = readItems(kind, body.items, PART_LIMITS[kind])
  if ('error' in part) return fail(400, part.error ?? 'Неверные данные')

  const deadline = Date.now() + WRITE_SECONDS * 1000
  const { result, processed } =
    kind === 'product'
      ? await writeProducts(payload, part.items, { deadline })
      : await writeOffers(payload, part.items, { deadline })
  const { snapshot } = run
  keepIssues(addResult(snapshot.result, result))
  snapshot.done[kind === 'product' ? 'products' : 'offers'] += processed
  await saveRun(payload, run.id, snapshot)
  return { ok: true, runId: run.id, processed, snapshot } satisfies RunReply
}

/** Конец: снять с публикации пропавшее. Только когда записан весь план. */
export async function finishRun(payload: Payload, body: Record<string, unknown>) {
  const run = await loadRun(payload, body.runId)
  if (!run) return fail(409, 'Запуск импорта не найден или уже закончен. Начните заново.')
  const keys = readKeys(body.keys)
  if ('error' in keys) return fail(400, keys.error ?? 'Неверные данные')
  const { snapshot } = run
  const { planned, done } = snapshot
  if (done.products < planned.products || done.offers < planned.offers)
    return fail(409, 'Записано не всё: завершить запуск пока нельзя.')
  if (keys.items.length !== planned.products + planned.offers)
    return fail(400, 'Список ключей не совпадает с планом запуска.')

  keepIssues(addResult(snapshot.result, await finishImport(payload, keys.items)))
  await saveRun(payload, run.id, snapshot, 'done')
  return { ok: true, runId: run.id, snapshot } satisfies RunReply
}

/** Часть картинок. skip — пути, которые уже не скачались в этой сессии. */
export async function imagesPart(payload: Payload, body: Record<string, unknown>) {
  const part = readItems('image', body.items, PART_LIMITS.image)
  if ('error' in part) return fail(400, part.error ?? 'Неверные данные')
  const skip = Array.isArray(body.skip)
    ? body.skip.filter((s): s is string => typeof s === 'string').slice(0, 5000)
    : []
  const images: ImageResult = await importImages(
    payload,
    { products: part.items },
    {
      skip,
      deadline: Date.now() + WRITE_SECONDS * 1000,
      fetch: (url: string) => fetchFile(url, { timeoutMs: 15_000 }),
      base: process.env.IMPORT_IMAGES_FROM || undefined,
    },
  )
  await addImagesToLatestRun(payload, images)
  return { ok: true, images } satisfies RunReply
}

/** Итог картинок дописывается в последний запуск со страницы админки, чтобы был в журнале. */
async function addImagesToLatestRun(payload: Payload, part: ImageResult) {
  const latest = await payload.find({
    collection: 'import-runs',
    sort: '-createdAt',
    limit: 1,
    ...OPTS,
  })
  const run = latest.docs[0]
  if (!run || !isSnapshot(run.snapshot)) return
  const images = run.snapshot.images ?? emptyImages()
  images.downloaded += part.downloaded
  images.reused += part.reused
  images.products += part.products
  images.postponed = part.postponed
  images.failed = [...images.failed, ...part.failed].slice(0, KEEP_ISSUES)
  await payload.update({
    collection: 'import-runs',
    id: run.id,
    data: { snapshot: { ...run.snapshot, images } },
    ...OPTS,
  })
}
