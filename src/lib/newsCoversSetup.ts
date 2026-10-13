import { readdir, readFile } from 'node:fs/promises'
import path from 'node:path'
import type { Payload } from 'payload'
import { TOPICS } from '../domain/topicSeed.mjs'

/** Ключ записи в журнале «Запуски импорта»: настройка выполняется один раз. */
export const NEWS_COVERS_SETUP_KEY = 'pages-setup:news-covers-v1'
/** Иллюстрации владельца (13.10.2026), WebP из `Макеты/CADkz_20_banners_1920x1080`. */
const COVERS_DIR = path.join(process.cwd(), 'public', 'images', 'news-covers')
const opts = { overrideAccess: true, depth: 0 } as const

/**
 * Иллюстрации-заглушки для новостей и статей без своей картинки: файлы `<тема>-<n>.webp` →
 * «Медиа» → поле «Обложки для публикаций без своей» у темы с тем же адресом. Прежние обложки
 * темы заменяются (решение владельца: использовать эти иллюстрации). Повтор не создаёт дублей:
 * файл в «Медиа» узнаётся по ключу. null — уже сделано.
 */
export async function setupNewsCovers(payload: Payload): Promise<string[] | null> {
  const done = await payload.find({
    collection: 'import-runs',
    where: { idempotencyKey: { equals: NEWS_COVERS_SETUP_KEY } },
    limit: 1,
    ...opts,
  })
  if (done.docs.length) return null

  const files = (await readdir(COVERS_DIR)).filter((name) => name.endsWith('.webp')).sort()
  const report: string[] = []
  for (const topic of TOPICS) {
    const own = files.filter((name) => name.startsWith(`${topic.slug}-`))
    const { docs } = await payload.find({
      collection: 'topics',
      where: { slug: { equals: topic.slug } },
      limit: 1,
      ...opts,
    })
    const doc = docs[0]
    if (!doc) {
      report.push(`${topic.title}: темы нет в базе, пропущено`)
      continue
    }
    const ids: number[] = []
    for (const name of own) ids.push(await coverMedia(payload, name, topic.title))
    await payload.update({ collection: 'topics', id: doc.id, data: { covers: ids }, ...opts })
    report.push(`${doc.title}: ${ids.length} (было ${doc.covers?.length ?? 0})`)
  }
  await payload.create({
    collection: 'import-runs',
    data: { idempotencyKey: NEWS_COVERS_SETUP_KEY, state: 'done', snapshot: { report } },
    ...opts,
  })
  return report
}

/** Файл из папки → запись «Медиа»; уже загруженный раньше берётся готовым. */
async function coverMedia(payload: Payload, name: string, topic: string): Promise<number> {
  const legacyKey = `asset:news-cover:${name}`
  const { docs } = await payload.find({
    collection: 'media',
    where: { legacyKey: { equals: legacyKey } },
    limit: 1,
    ...opts,
  })
  if (docs[0]) return docs[0].id
  const data = await readFile(path.join(COVERS_DIR, name))
  const media = await payload.create({
    collection: 'media',
    data: { alt: `Иллюстрация к теме «${topic}»`, legacyKey },
    file: { data, mimetype: 'image/webp', name: `news-cover-${name}`, size: data.length },
    ...opts,
  })
  return media.id
}
