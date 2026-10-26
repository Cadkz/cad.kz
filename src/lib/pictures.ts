import type { Payload } from 'payload'
import type { Manufacturer, Media, Product } from '../../payload-types'
import { programLogo, vendorLogo } from '../domain/cardLogos.mjs'
import { type SitePhoto, sitePhotos } from '../domain/sitePhotos.mjs'
import { relId } from './rel'

/** Как вписать картинку в карточку: логотип — небольшим знаком по центру, фото — на всю рамку. */
export type PictureFit = 'logo' | 'photo'

/**
 * Картинка, готовая для next/image: адрес, описание и исходные размеры. local — файл сайта
 * (логотип из public), его не нужно пережимать.
 */
export type Picture = {
  url: string
  alt: string
  width: number
  height: number
  fit?: PictureFit
  local?: boolean
}

/** Запись «Медиа» → картинка. Без адреса или размеров картинку не показываем. */
export function toPicture(value: number | Media | null | undefined, alt?: string): Picture | null {
  if (!value || typeof value === 'number') return null
  if (!value.url || !value.width || !value.height) return null
  return { url: value.url, alt: value.alt || alt || '', width: value.width, height: value.height }
}

/** Фото файлом сайта (src/domain/sitePhotos.mjs) → картинка; пережимает next/image. */
function sitePicture(photo: SitePhoto, alt: string): Picture {
  return { ...photo, alt }
}

/**
 * Картинки страницы товара: фото файлами сайта, затем своя галерея; если пусто —
 * картинка производителя. Товар нужен с раскрытыми связями (depth 2).
 */
export function productPictures(product: Product): Picture[] {
  const own = [
    ...sitePhotos(product.slug).map((photo) => sitePicture(photo, product.title)),
    ...(product.gallery ?? [])
      .map((item) => toPicture(item, product.title))
      .filter((picture): picture is Picture => Boolean(picture)),
  ]
  if (own.length) return own
  const vendor = product.manufacturer
  const fallback =
    vendor && typeof vendor !== 'number' ? toPicture(vendor.image, vendor.title) : null
  return fallback ? [fallback] : []
}

type CardProduct = Pick<Product, 'id' | 'title' | 'gallery' | 'manufacturer'> &
  Partial<Pick<Product, 'kind' | 'cardImage' | 'slug'>>
type CardVendor = Pick<Manufacturer, 'id' | 'title' | 'image'> & Partial<Pick<Manufacturer, 'logo'>>

type StaticLogo = { url: string; width: number; height: number }

/**
 * Что взять в карточку: файл «Медиа» по id, логотип из кода (src/domain/cardLogos.mjs) или
 * фото файлом сайта (src/domain/sitePhotos.mjs).
 */
type Choice = { media: number; fit: PictureFit } | { logo: StaticLogo } | { photo: SitePhoto }

/**
 * Выбор картинки карточки по правилу владельца (21.10.2026, src/domain/cardLogos.mjs):
 * программа — логотип, оборудование — фото устройства, курс и услуга — как раньше.
 */
function chooseCard(product: CardProduct, vendor: CardVendor | undefined): Choice | null {
  const own = relId(product.cardImage)
  const kind = product.kind ?? 'software'
  if (own != null) return { media: own, fit: kind === 'hardware' ? 'photo' : 'logo' }
  // Логотип программы по названию — при любом типе товара: Artec Studio и Artec Cloud бывают
  // отмечены как оборудование, но это программы. Раньше фото файлом сайта: скриншоты программ
  // (Artec Studio, Artec Cloud) — для страницы товара, карточка остаётся с логотипом.
  const program = programLogo({ title: product.title, vendor: vendor?.title ?? null })
  if (program) return { logo: program }
  const site = product.slug ? sitePhotos(product.slug)[0] : undefined
  if (site) return { photo: site }
  const gallery = relId(product.gallery?.[0])
  if (kind === 'hardware') return gallery == null ? null : { media: gallery, fit: 'photo' }
  if (kind === 'software') {
    const adminLogo = relId(vendor?.logo)
    if (adminLogo != null) return { media: adminLogo, fit: 'logo' }
    const fromCode = vendorLogo(vendor?.title ?? null)
    return fromCode ? { logo: fromCode } : null
  }
  const fallback = gallery ?? relId(vendor?.image)
  return fallback == null ? null : { media: fallback, fit: 'photo' }
}

/**
 * Картинки для карточек каталога (товары загружены без раскрытия связей). Все «Медиа» читаются
 * одним запросом. Логотипы из кода — файлы сайта, без «Медиа».
 */
export async function cardPictures(
  payload: Payload,
  products: CardProduct[],
  manufacturers: CardVendor[],
): Promise<Map<number, Picture>> {
  const vendorById = new Map(manufacturers.map((m) => [m.id, m]))
  const chosen = new Map<number, Choice>()
  for (const product of products) {
    const choice = chooseCard(product, vendorById.get(relId(product.manufacturer) ?? -1))
    if (choice) chosen.set(product.id, choice)
  }
  const ids = [
    ...new Set([...chosen.values()].flatMap((choice) => ('media' in choice ? [choice.media] : []))),
  ]
  const { docs } = ids.length
    ? await payload.find({
        collection: 'media',
        where: { id: { in: ids } },
        limit: ids.length,
        depth: 0,
        pagination: false,
      })
    : { docs: [] }
  const mediaById = new Map(docs.map((media) => [media.id, media]))
  const result = new Map<number, Picture>()
  for (const product of products) {
    const choice = chosen.get(product.id)
    if (!choice) continue
    const picture =
      'logo' in choice
        ? { ...choice.logo, alt: product.title, fit: 'logo' as const, local: true }
        : 'photo' in choice
          ? { ...sitePicture(choice.photo, product.title), fit: 'photo' as const }
          : toPicture(mediaById.get(choice.media), product.title)
    if (picture)
      result.set(product.id, 'media' in choice ? { ...picture, fit: choice.fit } : picture)
  }
  return result
}

/** Адрес файла «Медиа» (/api/media/file/<имя>) → имя файла, иначе null. */
function mediaFilename(src: string) {
  const match = /^\/api\/media\/file\/([^/?#]+)/.exec(src)
  if (!match?.[1]) return null
  try {
    return decodeURIComponent(match[1])
  } catch {
    return null
  }
}

/** Картинки из текста публикации: размеры берутся из «Медиа» одним запросом. */
export async function bodyPictures(
  payload: Payload,
  sources: string[],
): Promise<Map<string, Picture>> {
  const byName = new Map<string, string>()
  for (const src of sources) {
    const name = mediaFilename(src)
    if (name) byName.set(name, src)
  }
  if (!byName.size) return new Map()
  const { docs } = await payload.find({
    collection: 'media',
    where: { filename: { in: [...byName.keys()] } },
    limit: byName.size,
    depth: 0,
    pagination: false,
  })
  const result = new Map<string, Picture>()
  for (const media of docs) {
    const src = media.filename ? byName.get(media.filename) : undefined
    const picture = toPicture(media)
    if (src && picture) result.set(src, picture)
  }
  return result
}

/**
 * Логотипы производителей для плиток каталога (шаг «производитель»): «Логотип» из админки,
 * иначе знак из кода (src/domain/cardLogos.mjs), иначе без картинки. Ключ — название.
 */
export async function vendorPictures(
  payload: Payload,
  manufacturers: CardVendor[],
): Promise<Map<string, Picture>> {
  const ids = manufacturers.flatMap((m) => {
    const id = relId(m.logo)
    return id == null ? [] : [id]
  })
  const { docs } = ids.length
    ? await payload.find({
        collection: 'media',
        where: { id: { in: ids } },
        limit: ids.length,
        depth: 0,
        pagination: false,
      })
    : { docs: [] }
  const mediaById = new Map(docs.map((media) => [media.id, media]))
  const result = new Map<string, Picture>()
  for (const vendor of manufacturers) {
    const own = toPicture(mediaById.get(relId(vendor.logo) ?? -1), vendor.title)
    const code = vendorLogo(vendor.title)
    const picture = own
      ? { ...own, fit: 'logo' as const }
      : code
        ? { ...code, alt: vendor.title, fit: 'logo' as const, local: true }
        : null
    if (picture) result.set(vendor.title, picture)
  }
  return result
}
