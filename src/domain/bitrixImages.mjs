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

/** Скачивание по умолчанию: обычный запрос с ограничением по времени. */
export async function fetchFile(url) {
  const response = await fetch(url, { signal: AbortSignal.timeout(30_000) })
  if (!response.ok) throw new Error(`ответ ${response.status}`)
  const data = Buffer.from(await response.arrayBuffer())
  const header = response.headers.get('content-type')?.split(';')[0].trim()
  return { data, mimetype: header || null }
}

/**
 * limit — сколько картинок скачать за один запуск (остальные докачает следующий).
 * Возвращает счётчики и список картинок, которые не удалось скачать.
 */
export async function importImages(
  payload,
  plan,
  { fetch = fetchFile, base = OLD_SITE, limit = Number.POSITIVE_INFINITY, log = () => {} } = {},
) {
  const opts = { overrideAccess: true, depth: 0 }
  const all = async (collection) =>
    (await payload.find({ collection, pagination: false, ...opts })).docs
  const mediaByKey = new Map(
    (await all('media')).filter((m) => m.legacyKey).map((m) => [m.legacyKey, m.id]),
  )
  const productByKey = new Map(
    (await all('products')).filter((p) => p.legacyKey).map((p) => [p.legacyKey, p]),
  )
  const result = { downloaded: 0, reused: 0, products: 0, failed: [], postponed: 0 }

  for (const planned of plan.products) {
    const product = productByKey.get(planned.legacyKey)
    if (!product || !planned.images.length || product.gallery?.length) continue
    const ids = []
    let complete = true
    for (const imagePath of planned.images) {
      const key = `bitrix:image:${imagePath}`
      const known = mediaByKey.get(key)
      if (known) {
        ids.push(known)
        result.reused++
        continue
      }
      if (result.downloaded >= limit) {
        complete = false
        result.postponed++
        continue
      }
      try {
        const file = await fetch(new URL(imagePath, base).toString())
        const name = path.posix.basename(new URL(imagePath, base).pathname)
        const mimetype =
          file.mimetype && file.mimetype !== 'application/octet-stream'
            ? file.mimetype
            : MIME_BY_EXT[path.posix.extname(name).toLowerCase()]
        if (!mimetype?.startsWith('image/')) throw new Error(`не картинка (${file.mimetype})`)
        const doc = await payload.create({
          collection: 'media',
          data: { alt: planned.data.title, legacyKey: key, legacyUrl: imagePath },
          file: { data: file.data, mimetype, name, size: file.data.length },
          ...opts,
        })
        mediaByKey.set(key, doc.id)
        ids.push(doc.id)
        result.downloaded++
        if (result.downloaded % 50 === 0) log(`Картинки: скачано ${result.downloaded}`)
      } catch (error) {
        const reason = error instanceof Error ? error.message : String(error)
        result.failed.push({ product: planned.data.title, path: imagePath, reason })
      }
    }
    // Галерея ставится, когда скачано всё, что можно: иначе следующий запуск её не дополнит.
    if (complete && ids.length) {
      await payload.update({
        collection: 'products',
        id: product.id,
        data: { gallery: ids },
        ...opts,
      })
      result.products++
    }
  }
  return result
}
