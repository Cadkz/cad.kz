import path from 'node:path'
import type { Payload, Where } from 'payload'
import { failureReason, fetchFile } from '@/domain/bitrixImages.mjs'
import { OLD_SITE } from '@/domain/bitrixImport.mjs'
import {
  imageUrls,
  isPermanentImageFailure,
  legacyFileKey,
  restoredBody,
} from '@/domain/legacyImages.mjs'
import {
  INFO_PAGES,
  parseInfoPage,
  parseProductPage,
  parsePublicationPage,
  publicationTarget,
} from '@/domain/legacyPages.mjs'
import legacyPublications from '@/domain/legacyPublications.json'
import { MEDIA_MIME_TYPES, MEDIA_TYPE_BY_EXT } from '@/domain/mediaTypes.mjs'
import { productPath } from './productPath'

/**
 * Перенос со старого cad.kz по кнопкам в админке: новости, акции и статьи целиком, картинки
 * в их текстах и title/description товаров. Каждый запрос работает до ~20 секунд и говорит,
 * докуда дошёл; браузер шлёт следующий. Повтор безопасен: перенесённое не перезаписывается.
 * Работает, пока cad.kz ещё старый сайт: после переключения домена переносить будет неоткуда.
 */

const WORK_SECONDS = 20
/** Столько страниц старого сайта скачиваем одновременно. */
const PARALLEL = 6
const OPTS = { overrideAccess: true, depth: 0 } as const
/** Новости, акции и статьи старого сайта (scripts/legacy-sitemap.mjs). */
const PUBLICATION_PATHS: string[] = legacyPublications
const PUBLICATION_SET = new Set(PUBLICATION_PATHS)

/** Адрес старого сайта; для проверки на тестовом сервере — IMPORT_IMAGES_FROM. */
const oldSite = () => (process.env.IMPORT_IMAGES_FROM || OLD_SITE).replace(/\/+$/, '')

export type Failure = { path: string; reason: string }
export type PagesReply = {
  ok: true
  next: number
  total: number
  created: number
  updated: number
  existing: number
  failed: Failure[]
}
export type ImagesReply = {
  ok: true
  /** Последняя обработанная публикация: следующий запрос продолжает после неё. */
  after: number
  publications: number
  downloaded: number
  reused: number
  /** Сколько публикаций со старыми картинками осталось после `after`. */
  remaining: number
  failed: Failure[]
}
export type RestoreReply = {
  ok: true
  next: number
  total: number
  restored: number
  images: number
  skipped: number
  failed: Failure[]
}

/** Страница старого сайта как текст. 404 и ошибки — понятной причиной. */
async function fetchPage(url: string) {
  const response = await fetch(url, {
    signal: AbortSignal.timeout(15_000),
    headers: { 'user-agent': 'cad.kz-migration' },
  })
  if (!response.ok) throw new Error(`ответ ${response.status}`)
  return response.text()
}

function pageFailure(error: unknown) {
  return failureReason(error).replace('нет такого файла', 'нет такой страницы')
}

/** Свободный адрес публикации: занятый получает -2, -3… */
async function freeSlug(payload: Payload, wanted: string, reserved: Set<string>) {
  const { docs } = await payload.find({
    collection: 'publications',
    where: { slug: { like: wanted } },
    limit: 200,
    pagination: false,
    select: { slug: true },
    ...OPTS,
  })
  const taken = new Set([...docs.map((doc) => doc.slug), ...reserved])
  let slug = wanted
  for (let n = 2; taken.has(slug); n++) slug = `${wanted}-${n}`
  // Две новости с одинаковым кодом в одном запросе: второй достанется следующий номер.
  reserved.add(slug)
  return slug
}

const readOffset = (value: unknown) =>
  Number.isInteger(value) && Number(value) >= 0 ? Number(value) : 0

/** Текстовые страницы («О компании», «Доставка»…) → «Страницы». Уже перенесённые пропускаются. */
async function infoPages(payload: Payload, reply: PagesReply) {
  await Promise.all(
    INFO_PAGES.map(async ({ path: oldPath, slug }) => {
      const { docs } = await payload.find({
        collection: 'pages',
        where: {
          or: [{ slug: { equals: slug } }, { legacyKey: { equals: `legacy:page:${oldPath}` } }],
        },
        limit: 1,
        ...OPTS,
      })
      if (docs[0]) {
        reply.existing++
        return
      }
      let parsed: ReturnType<typeof parseInfoPage>
      try {
        parsed = parseInfoPage(await fetchPage(`${oldSite()}${oldPath}`), oldSite())
      } catch (error) {
        reply.failed.push({ path: oldPath, reason: pageFailure(error) })
        return
      }
      if (!parsed) {
        reply.failed.push({ path: oldPath, reason: 'на странице нет текста' })
        return
      }
      try {
        await payload.create({
          collection: 'pages',
          data: {
            title: parsed.title,
            status: 'published',
            slug,
            body: parsed.body,
            seo: { title: parsed.seo.title, description: parsed.seo.description || null },
            legacyKey: `legacy:page:${oldPath}`,
            legacyUrl: oldPath,
          },
          ...OPTS,
        })
        reply.created++
      } catch (error) {
        console.error('Перенос страницы', oldPath, error)
        reply.failed.push({ path: oldPath, reason: 'не сохранилась в базе' })
      }
    }),
  )
}

/**
 * Новость со старого сайта. Часть новостей cad.kz по своему адресу отдаёт общий список (испорчен
 * кэш старого сайта, так открывается и ссылка из его же списка), а версия для печати — саму
 * новость. Поэтому при пустом разборе пробуем ?print=Y.
 */
async function fetchPublication(oldPath: string) {
  const url = `${oldSite()}${encodeURI(oldPath)}`
  const parsed = parsePublicationPage(await fetchPage(url), oldPath, oldSite())
  if (parsed) return parsed
  return parsePublicationPage(await fetchPage(`${url}?print=Y`), oldPath, oldSite())
}

/**
 * Новости, акции и статьи: скачать страницу, разобрать, создать публикацию. Первый запрос
 * (offset 0) ещё переносит текстовые страницы. Уже перенесённое пропускается.
 */
export async function publicationsPart(payload: Payload, body: Record<string, unknown>) {
  const deadline = Date.now() + WORK_SECONDS * 1000
  const total = PUBLICATION_PATHS.length
  let next = Math.min(readOffset(body.offset), total)
  const reply: PagesReply = {
    ok: true,
    next,
    total,
    created: 0,
    updated: 0,
    existing: 0,
    failed: [],
  }
  const reserved = new Set<string>()
  if (next === 0) await infoPages(payload, reply)
  while (next < total && Date.now() < deadline) {
    const group = PUBLICATION_PATHS.slice(next, next + PARALLEL)
    const keys = group.map((p) => `legacy:page:${p}`)
    const { docs } = await payload.find({
      collection: 'publications',
      where: { legacyKey: { in: keys } },
      limit: group.length,
      pagination: false,
      select: { legacyKey: true },
      ...OPTS,
    })
    const done = new Set(docs.map((doc) => doc.legacyKey))
    const pages = await Promise.all(
      group.map(async (oldPath) => {
        if (done.has(`legacy:page:${oldPath}`)) return { oldPath, existing: true as const }
        try {
          return { oldPath, parsed: await fetchPublication(oldPath) }
        } catch (error) {
          return { oldPath, error: pageFailure(error) }
        }
      }),
    )
    for (const page of pages) {
      if ('existing' in page) {
        reply.existing++
        continue
      }
      if ('error' in page) {
        reply.failed.push({ path: page.oldPath, reason: page.error ?? 'ошибка' })
        continue
      }
      const parsed = page.parsed
      if (!parsed) {
        reply.failed.push({ path: page.oldPath, reason: 'на странице нет текста новости' })
        continue
      }
      try {
        await payload.create({
          collection: 'publications',
          data: {
            title: parsed.title,
            status: 'published',
            kind: parsed.kind,
            slug: await freeSlug(payload, parsed.slug, reserved),
            excerpt: parsed.excerpt || null,
            body: parsed.body,
            publishedAt: parsed.publishedAt,
            seo: { title: parsed.seo.title, description: parsed.seo.description || null },
            legacyKey: `legacy:page:${page.oldPath}`,
            legacyUrl: page.oldPath,
          },
          ...OPTS,
        })
        reply.created++
      } catch (error) {
        console.error('Перенос публикации', page.oldPath, error)
        reply.failed.push({ path: page.oldPath, reason: 'не сохранилась в базе' })
      }
    }
    next += group.length
  }
  reply.next = next
  return reply
}

/** Опубликованные товары, которые были на старом сайте: их старые адреса, по порядку ID. */
async function legacyProducts(payload: Payload) {
  const { docs } = await payload.find({
    collection: 'products',
    where: { status: { equals: 'published' } },
    sort: 'id',
    limit: 5000,
    pagination: false,
    select: { slug: true, legacyUrl: true, seo: true },
    ...OPTS,
  })
  return docs
    .map((doc) => ({ doc, path: productPath(doc) }))
    .filter(({ path: p }) => p.startsWith('/catalog/'))
}

/** Title и description товаров со старых страниц. Заполняются только пустые поля. */
export async function productsPart(payload: Payload, body: Record<string, unknown>) {
  const deadline = Date.now() + WORK_SECONDS * 1000
  const items = await legacyProducts(payload)
  const total = items.length
  let next = Math.min(readOffset(body.offset), total)
  const reply: PagesReply = {
    ok: true,
    next,
    total,
    created: 0,
    updated: 0,
    existing: 0,
    failed: [],
  }
  while (next < total && Date.now() < deadline) {
    const group = items.slice(next, next + PARALLEL)
    await Promise.all(
      group.map(async ({ doc, path: oldPath }) => {
        if (doc.seo?.title && doc.seo?.description) {
          reply.existing++
          return
        }
        try {
          const page = parseProductPage(await fetchPage(`${oldSite()}${encodeURI(oldPath)}`))
          const seo = {
            title: doc.seo?.title || page.title || null,
            description: doc.seo?.description || page.description || null,
          }
          if (
            seo.title === (doc.seo?.title ?? null) &&
            seo.description === (doc.seo?.description ?? null)
          ) {
            reply.existing++
            return
          }
          await payload.update({ collection: 'products', id: doc.id, data: { seo }, ...OPTS })
          reply.updated++
        } catch (error) {
          reply.failed.push({ path: oldPath, reason: pageFailure(error) })
        }
      }),
    )
    next += group.length
  }
  reply.next = next
  return reply
}

/** Картинка в тексте, которая ещё лежит на старом сайте. */
const OLD_IMAGE = () =>
  new RegExp(
    `!\\[([^\\]]*)\\]\\((${oldSite().replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}/[^)\\s]+)\\)`,
    'g',
  )

const pendingImages = (): Where => ({ body: { contains: `](${oldSite()}/` } })

/** Картинка со старого сайта → запись «Медиа» (одна на файл, повтор берёт готовую). */
async function mediaFor(payload: Payload, url: string, alt: string) {
  const pathname = decodeURIComponent(new URL(url).pathname)
  const legacyKey = `legacy:file:${pathname}`
  const { docs } = await payload.find({
    collection: 'media',
    where: { legacyKey: { equals: legacyKey } },
    limit: 1,
    ...OPTS,
  })
  if (docs[0]?.url) return { media: docs[0], reused: true }
  const file = await fetchFile(url, { timeoutMs: 15_000 })
  const name = path.posix.basename(pathname)
  const byExt = MEDIA_TYPE_BY_EXT[path.posix.extname(name).toLowerCase()]
  const mimetype =
    file.mimetype && file.mimetype !== 'application/octet-stream' ? file.mimetype : byExt
  if (!mimetype || !MEDIA_MIME_TYPES.includes(mimetype))
    throw new Error(`формат ${mimetype ?? 'неизвестен'} не принимается в «Медиа»`)
  try {
    const media = await payload.create({
      collection: 'media',
      data: { alt: alt || 'Картинка из статьи', legacyKey, legacyUrl: pathname },
      file: { data: file.data, mimetype, name, size: file.data.length },
      ...OPTS,
    })
    return { media, reused: false }
  } catch (error) {
    // Ту же картинку только что сохранил другой запрос (ключ занят) — берём готовую.
    const again = await payload.find({
      collection: 'media',
      where: { legacyKey: { equals: legacyKey } },
      limit: 1,
      ...OPTS,
    })
    if (again.docs[0]?.url) return { media: again.docs[0], reused: true }
    throw error
  }
}

/** Одна публикация или страница: старые картинки → «Медиа». Меняет reply, возвращает текст. */
async function replaceImages(
  payload: Payload,
  doc: { title: string; body?: string | null; legacyUrl?: string | null },
  reply: ImagesReply,
  setCover: (id: number) => void,
) {
  let body = doc.body ?? ''
  for (const match of [...body.matchAll(OLD_IMAGE())]) {
    const [whole, alt = '', url = ''] = match
    try {
      const { media, reused } = await mediaFor(payload, url, alt || doc.title)
      body = body.replace(whole, `![${alt}](${media.url})`)
      setCover(media.id)
      if (reused) reply.reused++
      else reply.downloaded++
    } catch (error) {
      const permanent = isPermanentImageFailure(error)
      // Файла нет на старом сайте — убираем из текста. Сбой сети или сохранения — оставляем
      // ссылку как есть: повторный запуск шага докачает.
      if (permanent) body = body.replace(whole, '').replace(/\n{3,}/g, '\n\n')
      reply.failed.push({
        path: `${doc.legacyUrl ?? doc.title}: ${decodeURIComponent(new URL(url).pathname)}`,
        reason: permanent
          ? failureReason(error)
          : `${failureReason(error)} — картинка оставлена, запустите шаг ещё раз`,
      })
    }
  }
  return body.trim()
}

/**
 * Картинки в текстах перенесённых публикаций: скачать в «Медиа» и заменить адрес в тексте.
 * Идёт по публикациям по порядку ID после `after`, поэтому картинка, которая не скачалась из-за
 * сбоя, не задерживает остальные. Убирается из текста только картинка, которой на старом сайте
 * нет. Первая картинка становится обложкой, если обложки нет. Страницы — в первом запросе.
 */
export async function textImagesPart(payload: Payload, body: Record<string, unknown>) {
  const deadline = Date.now() + WORK_SECONDS * 1000
  let after = readOffset(body.after)
  const reply: ImagesReply = {
    ok: true,
    after,
    publications: 0,
    downloaded: 0,
    reused: 0,
    remaining: 0,
    failed: [],
  }
  if (after === 0) {
    const pages = await payload.find({
      collection: 'pages',
      where: pendingImages(),
      sort: 'id',
      limit: 20,
      select: { body: true, title: true, legacyUrl: true },
      ...OPTS,
    })
    for (const page of pages.docs) {
      const text = await replaceImages(payload, page, reply, () => {})
      if (text !== page.body)
        await payload.update({ collection: 'pages', id: page.id, data: { body: text }, ...OPTS })
    }
  }
  const pendingAfter = (id: number): Where => ({
    and: [pendingImages(), { id: { greater_than: id } }],
  })
  const { docs } = await payload.find({
    collection: 'publications',
    where: pendingAfter(after),
    sort: 'id',
    limit: 10,
    select: { body: true, title: true, cover: true, legacyUrl: true },
    ...OPTS,
  })
  for (const doc of docs) {
    if (Date.now() > deadline) break
    let cover = doc.cover ?? null
    const text = await replaceImages(payload, doc, reply, (id) => {
      cover ??= id
    })
    if (text !== doc.body || cover !== (doc.cover ?? null))
      await payload.update({
        collection: 'publications',
        id: doc.id,
        data: { body: text, cover },
        ...OPTS,
      })
    after = doc.id
    reply.publications++
  }
  reply.after = after
  const left = await payload.count({
    collection: 'publications',
    where: pendingAfter(after),
    overrideAccess: true,
  })
  reply.remaining = left.totalDocs
  return reply
}

/**
 * Возврат картинок, которые шаг 2 раньше убрал из текста по ошибке (сбой, а не отсутствие
 * файла). Заново читает старую страницу публикации и, если текст без картинок совпадает с
 * сохранённым, а картинок на старой странице больше, возвращает их: уже скачанные — адресом
 * «Медиа», остальные — старым адресом (их скачает шаг 2). Правленные в админке тексты не трогает.
 */
export async function restoreImagesPart(payload: Payload, body: Record<string, unknown>) {
  const deadline = Date.now() + WORK_SECONDS * 1000
  const { docs: all } = await payload.find({
    collection: 'publications',
    where: { legacyUrl: { exists: true } },
    sort: 'id',
    limit: 5000,
    pagination: false,
    select: { legacyUrl: true },
    ...OPTS,
  })
  const items = all.filter((doc) => doc.legacyUrl && PUBLICATION_SET.has(doc.legacyUrl))
  const total = items.length
  let next = Math.min(readOffset(body.offset), total)
  const reply: RestoreReply = {
    ok: true,
    next,
    total,
    restored: 0,
    images: 0,
    skipped: 0,
    failed: [],
  }
  while (next < total && Date.now() < deadline) {
    const group = items.slice(next, next + PARALLEL)
    await Promise.all(
      group.map(async ({ id, legacyUrl }) => {
        const oldPath = String(legacyUrl)
        try {
          const parsed = await fetchPublication(oldPath)
          if (!parsed) return
          const doc = await payload.findByID({
            collection: 'publications',
            id,
            select: { body: true, cover: true },
            ...OPTS,
          })
          const urls = imageUrls(parsed.body)
          if (urls.length <= imageUrls(doc.body).length) return
          const keys = urls.map(legacyFileKey).filter((k): k is string => Boolean(k))
          const { docs: media } = await payload.find({
            collection: 'media',
            where: { legacyKey: { in: keys } },
            limit: keys.length,
            pagination: false,
            select: { legacyKey: true, url: true },
            ...OPTS,
          })
          const byKey = new Map(media.map((m) => [m.legacyKey, m]))
          const text = restoredBody(doc.body ?? '', parsed.body, (url) => {
            const key = legacyFileKey(url)
            return (key && byKey.get(key)?.url) || null
          })
          if (text == null) {
            reply.skipped++
            return
          }
          const firstMedia = urls
            .map((url) => byKey.get(legacyFileKey(url) ?? ''))
            .find((m) => m?.id)
          await payload.update({
            collection: 'publications',
            id,
            data: { body: text, cover: doc.cover ?? firstMedia?.id ?? null },
            ...OPTS,
          })
          reply.restored++
          reply.images += urls.length - imageUrls(doc.body).length
        } catch (error) {
          reply.failed.push({ path: oldPath, reason: pageFailure(error) })
        }
      }),
    )
    next += group.length
  }
  reply.next = next
  return reply
}

/** Сколько всего переносить: для подписи на странице админки. */
export function legacyTotals() {
  const kinds = { news: 0, promotion: 0, article: 0 }
  for (const p of PUBLICATION_PATHS) {
    const target = publicationTarget(p)
    if (target) kinds[target.kind as keyof typeof kinds]++
  }
  return { publications: PUBLICATION_PATHS.length, ...kinds }
}
