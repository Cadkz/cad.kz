// Картинки товаров со старого сайта: скачивает их в «Медиа» и ставит в галерею товара.
// Картинка запоминается по ключу bitrix:image:<путь>, поэтому повторный запуск не качает её
// заново. Галерею, в которой уже что-то есть, не трогает: её мог собрать редактор.
import path from 'node:path'
import { OLD_SITE } from './bitrixImport.mjs'

const MIME_BY_EXT = {
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.png': 'image/png',
  '.webp': 'image/webp',
  '.avif': 'image/avif',
  '.svg': 'image/svg+xml',
}

/**
 * Скачивание по умолчанию: обычный запрос с ограничением по времени.
 * @param {string} url
 * @param {{ timeoutMs?: number }} [options]
 */
export async function fetchFile(url, { timeoutMs = 30_000 } = {}) {
  const response = await fetch(url, { signal: AbortSignal.timeout(timeoutMs) })
  if (!response.ok) throw new Error(`ответ ${response.status}`)
  const data = Buffer.from(await response.arrayBuffer())
  const header = response.headers.get('content-type')?.split(';')[0].trim()
  return { data, mimetype: header || null }
}

/**
 * Адрес картинки на старом сайте. Путь из выгрузки должен быть путём на этом сайте
 * («/upload/…»): полный адрес другого сервера не скачиваем.
 */
export function imageUrl(imagePath, base = OLD_SITE) {
  const value = String(imagePath)
  if (!value.startsWith('/') || value.startsWith('//')) return null
  const url = new URL(value, base)
  return url.origin === new URL(base).origin ? url : null
}

/**
 * Скачивает картинки товаров плана (plan.products или часть их). Возвращает счётчики и список
 * картинок, которые не удалось скачать.
 *   limit    — сколько картинок скачать за вызов (остальные докачает следующий);
 *   deadline — отметка Date.now(), после которой новые скачивания не начинаются;
 *   skip     — пути, которые уже не скачались раньше: не пробуем снова, галерею не держим;
 *   parallel — сколько товаров обрабатывать одновременно.
 * @param {object} payload
 * @param {{ products: { legacyKey: string, images: string[], data: { title: string } }[] }} plan
 * @param {object} [options]
 * @param {(url: string) => Promise<{ data: Buffer, mimetype: string | null }>} [options.fetch]
 * @param {string} [options.base]
 * @param {number} [options.limit]
 * @param {number} [options.deadline]
 * @param {string[]} [options.skip]
 * @param {number} [options.parallel]
 * @param {(message: string) => void} [options.log]
 */
export async function importImages(
  payload,
  plan,
  {
    fetch = fetchFile,
    base = OLD_SITE,
    limit = Number.POSITIVE_INFINITY,
    deadline,
    skip = [],
    parallel = 4,
    log = () => {},
  } = {},
) {
  const opts = { overrideAccess: true, depth: 0 }
  const findIn = async (collection, field, values) =>
    values.length
      ? (
          await payload.find({
            collection,
            where: { [field]: { in: [...new Set(values)] } },
            pagination: false,
            ...opts,
          })
        ).docs
      : []
  const planned = plan.products.filter((p) => p.images.length)
  const keyOf = (imagePath) => `bitrix:image:${imagePath}`
  const mediaByKey = new Map(
    (
      await findIn(
        'media',
        'legacyKey',
        planned.flatMap((p) => p.images.map(keyOf)),
      )
    ).map((m) => [m.legacyKey, m.id]),
  )
  const productByKey = new Map(
    (
      await findIn(
        'products',
        'legacyKey',
        planned.map((p) => p.legacyKey),
      )
    ).map((p) => [p.legacyKey, p]),
  )
  const skipped = new Set(skip)
  /** @type {{ downloaded: number, reused: number, products: number, failed: { product: string, path: string, reason: string }[], postponed: number }} */
  const result = { downloaded: 0, reused: 0, products: 0, failed: [], postponed: 0 }
  let started = 0

  async function download(item, imagePath) {
    const url = imageUrl(imagePath, base)
    if (!url) throw new Error('адрес не на старом сайте')
    const file = await fetch(url.toString())
    const name = path.posix.basename(url.pathname)
    const mimetype =
      file.mimetype && file.mimetype !== 'application/octet-stream'
        ? file.mimetype
        : MIME_BY_EXT[path.posix.extname(name).toLowerCase()]
    if (!mimetype?.startsWith('image/')) throw new Error(`не картинка (${file.mimetype})`)
    const doc = await payload.create({
      collection: 'media',
      data: { alt: item.data.title, legacyKey: keyOf(imagePath), legacyUrl: imagePath },
      file: { data: file.data, mimetype, name, size: file.data.length },
      ...opts,
    })
    return doc.id
  }

  /** Одна картинка: id в «Медиа», 'later' — отложена до следующего вызова, null — не скачалась. */
  async function oneImage(item, imagePath) {
    const known = mediaByKey.get(keyOf(imagePath))
    if (known) {
      result.reused++
      return known
    }
    if (skipped.has(imagePath)) return null
    if (started >= limit || (deadline !== undefined && Date.now() >= deadline)) {
      result.postponed++
      return 'later'
    }
    started++
    try {
      const id = await download(item, imagePath)
      mediaByKey.set(keyOf(imagePath), id)
      result.downloaded++
      if (result.downloaded % 50 === 0) log(`Картинки: скачано ${result.downloaded}`)
      return id
    } catch (error) {
      const reason = error instanceof Error ? error.message : String(error)
      result.failed.push({ product: item.data.title, path: imagePath, reason })
      return null
    }
  }

  async function oneProduct(item) {
    const product = productByKey.get(item.legacyKey)
    if (!product || product.gallery?.length) return
    const found = []
    for (const imagePath of item.images) found.push(await oneImage(item, imagePath))
    // Галерея ставится, когда скачано всё, что можно: иначе следующий запуск её не дополнит.
    const ids = found.filter((id) => id !== null)
    if (!ids.length || ids.includes('later')) return
    await payload.update({
      collection: 'products',
      id: product.id,
      data: { gallery: ids },
      ...opts,
    })
    result.products++
  }

  const queue = [...planned]
  const worker = async () => {
    for (let item = queue.shift(); item; item = queue.shift()) await oneProduct(item)
  }
  await Promise.all(Array.from({ length: Math.max(1, parallel) }, worker))
  return result
}
