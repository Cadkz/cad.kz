import type { Payload } from 'payload'
import { isPng } from '../domain/isPng.mjs'
import { relId, relIds } from './rel'

// Решение владельца 26.10.2026: старые картинки Битрикса убираем.
// - Программы: галерея очищается целиком (там коробки вроде «Revit 2020»); на странице остаются
//   скриншоты файлами сайта (SITE_PHOTOS), в карточке каталога — логотип.
// - Всё остальное (оборудование, курсы, услуги): из галереи и «Картинки для карточки» убираются
//   картинки не в PNG — вырезанные PNG владельца остаются, фото файлами сайта не затрагиваются.
// Файлы в «Медиа» не удаляются: вернуть — товар → «Галерея» / «Картинка для карточки».

export const OLD_PICTURES_KEY = 'catalog-setup:old-pictures-clear-2026-10-26'
const opts = { overrideAccess: true, depth: 0 } as const

export async function clearOldPictures(payload: Payload): Promise<string[] | null> {
  const done = await payload.find({
    collection: 'import-runs',
    where: { idempotencyKey: { equals: OLD_PICTURES_KEY } },
    limit: 1,
    ...opts,
  })
  if (done.docs.length) return null
  const { docs } = await payload.find({ collection: 'products', pagination: false, ...opts })
  const mediaIds = new Set<number>()
  for (const product of docs) {
    for (const id of relIds(product.gallery)) mediaIds.add(id)
    const card = relId(product.cardImage)
    if (card != null) mediaIds.add(card)
  }
  const media = await payload.find({
    collection: 'media',
    where: { id: { in: [...mediaIds] } },
    pagination: false,
    ...opts,
  })
  const png = new Set(media.docs.filter(isPng).map((doc) => doc.id))

  const report: string[] = []
  let software = 0
  let other = 0
  for (const product of docs) {
    const gallery = relIds(product.gallery)
    const card = relId(product.cardImage)
    const isSoftware = product.kind === 'software'
    const nextGallery = isSoftware ? [] : gallery.filter((id) => png.has(id))
    const dropCard = !isSoftware && card != null && !png.has(card)
    const removed = gallery.length - nextGallery.length + (dropCard ? 1 : 0)
    if (!removed) continue
    await payload.update({
      collection: 'products',
      id: product.id,
      data: {
        gallery: nextGallery,
        ...(dropCard ? { cardImage: null } : {}),
        mainSection: relId(product.mainSection),
        extraSections: relIds(product.extraSections),
      },
      ...opts,
    })
    if (isSoftware) software++
    else other++
    report.push(`${product.title}: убрано старых картинок — ${removed}`)
  }
  report.unshift(
    `Программ без старых картинок: ${software}, остальных товаров без не-PNG: ${other}`,
  )
  await payload.create({
    collection: 'import-runs',
    data: { idempotencyKey: OLD_PICTURES_KEY, state: 'done', snapshot: { report } },
    ...opts,
  })
  return report
}
