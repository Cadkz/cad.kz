import type { Payload } from 'payload'
import type { Manufacturer, Media, Product } from '../../payload-types'
import { relId } from './rel'

/** Картинка, готовая для next/image: адрес, описание и исходные размеры. */
export type Picture = { url: string; alt: string; width: number; height: number }

/** Запись «Медиа» → картинка. Без адреса или размеров картинку не показываем. */
export function toPicture(value: number | Media | null | undefined, alt?: string): Picture | null {
  if (!value || typeof value === 'number') return null
  if (!value.url || !value.width || !value.height) return null
  return { url: value.url, alt: value.alt || alt || '', width: value.width, height: value.height }
}

/**
 * Картинки страницы товара: своя галерея, а если она пуста — картинка производителя.
 * Товар нужен с раскрытыми связями (depth 2).
 */
export function productPictures(product: Product): Picture[] {
  const own = (product.gallery ?? [])
    .map((item) => toPicture(item, product.title))
    .filter((picture): picture is Picture => Boolean(picture))
  if (own.length) return own
  const vendor = product.manufacturer
  const fallback =
    vendor && typeof vendor !== 'number' ? toPicture(vendor.image, vendor.title) : null
  return fallback ? [fallback] : []
}

/**
 * Первая картинка для карточек каталога (товары загружены без раскрытия связей):
 * первая из галереи или картинка производителя. Все «Медиа» читаются одним запросом.
 */
export async function cardPictures(
  payload: Payload,
  products: Pick<Product, 'id' | 'title' | 'gallery' | 'manufacturer'>[],
  manufacturers: Pick<Manufacturer, 'id' | 'title' | 'image'>[],
): Promise<Map<number, Picture>> {
  const vendorImage = new Map(manufacturers.map((m) => [m.id, relId(m.image)]))
  const wanted = new Map<number, number>()
  for (const product of products) {
    const own = relId(product.gallery?.[0])
    const vendor = vendorImage.get(relId(product.manufacturer) ?? -1)
    const id = own ?? vendor
    if (id != null) wanted.set(product.id, id)
  }
  const ids = [...new Set(wanted.values())]
  if (!ids.length) return new Map()
  const { docs } = await payload.find({
    collection: 'media',
    where: { id: { in: ids } },
    limit: ids.length,
    depth: 0,
    pagination: false,
  })
  const mediaById = new Map(docs.map((media) => [media.id, media]))
  const result = new Map<number, Picture>()
  for (const product of products) {
    const mediaId = wanted.get(product.id)
    const picture = mediaId != null ? toPicture(mediaById.get(mediaId), product.title) : null
    if (picture) result.set(product.id, picture)
  }
  return result
}
