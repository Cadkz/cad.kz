// Картинки товаров со старого сайта: скачивает их в «Медиа» и ставит в галерею товара.
// Картинка запоминается по ключу bitrix:image:<путь>, поэтому повторный запуск не качает её
// заново. Галерею, в которой уже что-то есть, не трогает: её мог собрать редактор.
import path from 'node:path'
import { OLD_SITE } from './bitrixImport.mjs'
import { MEDIA_MIME_TYPES, MEDIA_TYPE_BY_EXT } from './mediaTypes.mjs'

/**
 * Причина, понятная редактору: «нет файла», «не ответил», «формат», а не текст исключения.
 * @param {unknown} error
 */
export function failureReason(error) {
  const message = error instanceof Error ? error.message : String(error)
  const name = error instanceof Error ? error.name : ''
  const status = /^ответ (\d+)$/.exec(message)?.[1]
  if (status === '404') return 'на старом сайте нет такого файла (ответ 404)'
  if (status) return `старый сайт ответил ошибкой ${status}`
  if (name === 'TimeoutError' || name === 'AbortError') return 'старый сайт не ответил за 30 секунд'
  if (message.startsWith('формат') || message.startsWith('адрес')) return message
  return `не сохранилась в «Медиа»: ${message}`
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
  /**
   * notInBase — товаров ещё нет в базе (сначала запись каталога), hadGallery — галерея уже есть.
   * @type {{ downloaded: number, reused: number, products: number, failed: { product: string, path: string, reason: string }[], postponed: number, notInBase: number, hadGallery: number }}
   */
  const result = {
    downloaded: 0,
    reused: 0,
    products: 0,
    failed: [],
    postponed: 0,
    notInBase: 0,
    hadGallery: 0,
  }
  let started = 0
  /**
   * Скачивания в работе. Одна картинка бывает у нескольких товаров (вся линейка MagiCAD), и без
   * этого параллельные потоки сохраняли её дважды, второй получал отказ «legacyKey недействителен».
   * @type {Map<string, Promise<number | null>>}
   */
  const inFlight = new Map()

  async function download(item, imagePath) {
    const url = imageUrl(imagePath, base)
    if (!url) throw new Error('адрес не на старом сайте cad.kz')
    const file = await fetch(url.toString())
    const name = path.posix.basename(url.pathname)
    const mimetype =
      file.mimetype && file.mimetype !== 'application/octet-stream'
        ? file.mimetype
        : MEDIA_TYPE_BY_EXT[path.posix.extname(name).toLowerCase()]
    if (!mimetype || !MEDIA_MIME_TYPES.includes(mimetype))
      throw new Error(`формат ${mimetype ?? 'неизвестен'} не принимается в «Медиа»`)
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
    const pending = inFlight.get(imagePath)
    if (pending) {
      const id = await pending
      if (id !== null) result.reused++
      return id
    }
    if (started >= limit || (deadline !== undefined && Date.now() >= deadline)) {
      result.postponed++
      return 'later'
    }
    started++
    const job = download(item, imagePath).then(
      (id) => {
        mediaByKey.set(keyOf(imagePath), id)
        result.downloaded++
        if (result.downloaded % 50 === 0) log(`Картинки: скачано ${result.downloaded}`)
        return id
      },
      (error) => {
        result.failed.push({
          product: item.data.title,
          path: imagePath,
          reason: failureReason(error),
        })
        return null
      },
    )
    inFlight.set(imagePath, job)
    try {
      return await job
    } finally {
      inFlight.delete(imagePath)
    }
  }

  async function oneProduct(item) {
    const product = productByKey.get(item.legacyKey)
    if (!product) {
      result.notInBase++
      return
    }
    if (product.gallery?.length) {
      result.hadGallery++
      return
    }
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
