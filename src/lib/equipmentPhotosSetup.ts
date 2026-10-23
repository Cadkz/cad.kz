import { readFile } from 'node:fs/promises'
import path from 'node:path'
import type { Payload } from 'payload'
import { EQUIPMENT_PHOTOS } from '../domain/equipmentPhotos.mjs'

/** Ключ в «Запусках импорта»: пачка 1 (плоттеры Canon) загружается один раз. */
export const EQUIPMENT_PHOTOS_KEY = 'catalog-setup:equipment-photos-v1'
const PHOTOS_DIR = path.join(process.cwd(), 'public', 'images', 'equipment')
const opts = { overrideAccess: true, depth: 0 } as const

/**
 * Фото оборудования → «Медиа» → «Картинка для карточки» товара. Это фото карточки в каталоге
 * и сцены первого экрана на странице товара; галерея товара не меняется. Повтор после сбоя не
 * создаёт дублей (файл узнаётся по ключу). Не найден товар — настройка повторится при сборке.
 */
export async function setupEquipmentPhotos(payload: Payload): Promise<string[] | null> {
  const done = await payload.find({
    collection: 'import-runs',
    where: { idempotencyKey: { equals: EQUIPMENT_PHOTOS_KEY } },
    limit: 1,
    ...opts,
  })
  if (done.docs.length) return null
  const report: string[] = []
  let missing = 0
  for (const { file, slug } of EQUIPMENT_PHOTOS) {
    const { docs } = await payload.find({
      collection: 'products',
      where: { slug: { equals: slug } },
      limit: 1,
      ...opts,
    })
    const product = docs[0]
    if (!product) {
      missing++
      report.push(`Не найден товар ${slug} для ${file}`)
      continue
    }
    const media = await photoMedia(payload, file, product.title)
    await payload.update({
      collection: 'products',
      id: product.id,
      data: { cardImage: media },
      ...opts,
    })
    report.push(`${product.title}: фото ${file}`)
  }
  if (missing) {
    report.push(`Не найдено товаров: ${missing}. Настройка будет повторена при следующей сборке.`)
    return report
  }
  await payload.create({
    collection: 'import-runs',
    data: { idempotencyKey: EQUIPMENT_PHOTOS_KEY, state: 'done', snapshot: { report } },
    ...opts,
  })
  return report
}

async function photoMedia(payload: Payload, file: string, title: string): Promise<number> {
  const legacyKey = `asset:equipment-photo:${file}`
  const { docs } = await payload.find({
    collection: 'media',
    where: { legacyKey: { equals: legacyKey } },
    limit: 1,
    ...opts,
  })
  if (docs[0]) return docs[0].id
  const data = await readFile(path.join(PHOTOS_DIR, file))
  const media = await payload.create({
    collection: 'media',
    data: { alt: title, legacyKey },
    file: { data, mimetype: 'image/webp', name: `equipment-${file}`, size: data.length },
    ...opts,
  })
  return media.id
}
