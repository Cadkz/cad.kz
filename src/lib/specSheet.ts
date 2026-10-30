import sharp from 'sharp'
import { parseRequisites } from '@/domain/requisites.mjs'
import {
  contactLines,
  hasSpecSheet,
  requisiteLines,
  specSheetDate,
  specSheetFileName,
  specSheetModel,
} from '@/domain/specSheet.mjs'
import { getContacts } from './navigation'
import { getPage } from './pages'
import { getProduct } from './product'
import { siteUrl } from './seo'
import { renderSpecSheet } from './specSheetPdf'

/** Фото ждём недолго: без фото PDF всё равно полезен. */
const PHOTO_TIMEOUT_MS = 5000

/**
 * Фото товара для PDF: первая картинка сцены (вырезанное фото) или галереи → JPEG на белом
 * фоне, не больше 900 px. pdfkit читает только JPEG и PNG, а у нас бывают WebP.
 */
async function loadPhoto(url: string | undefined, origin: string): Promise<Buffer | null> {
  if (!url) return null
  try {
    const response = await fetch(new URL(url, origin), {
      signal: AbortSignal.timeout(PHOTO_TIMEOUT_MS),
    })
    if (!response.ok) return null
    const source = Buffer.from(await response.arrayBuffer())
    return await sharp(source)
      .flatten({ background: { r: 255, g: 255, b: 255 } })
      .resize({ width: 900, height: 700, fit: 'inside', withoutEnlargement: true })
      .jpeg({ quality: 82 })
      .toBuffer()
  } catch {
    return null
  }
}

/**
 * PDF «Характеристики оборудования» для товара по адресу. null — нет такого опубликованного
 * оборудования с характеристиками (тогда 404).
 * @param origin — адрес сайта из запроса: картинки в локальной папке media отдаёт сам сайт
 */
export async function buildSpecSheet(
  slug: string,
  origin: string,
): Promise<{ pdf: Buffer; fileName: string } | null> {
  const product = await getProduct(slug)
  if (!product || product.pageView === 'none' || !hasSpecSheet(product)) return null
  const picture = product.stagePictures[0] ?? product.pictures[0]
  const [contacts, requisitesPage, photo] = await Promise.all([
    getContacts(),
    getPage('requisites'),
    loadPhoto(picture?.url, origin),
  ])
  const site = siteUrl()
  const model = specSheetModel(
    {
      title: product.title,
      vendor: product.vendor,
      summary: product.summary,
      slug: product.slug,
      url: `${site}${product.path}`,
      properties: product.properties,
    },
    {
      date: specSheetDate(),
      contacts: contactLines(contacts, site.replace(/^https?:\/\//, '')),
      requisites: requisiteLines(parseRequisites(requisitesPage?.body ?? '')),
    },
  )
  return { pdf: await renderSpecSheet(model, photo), fileName: specSheetFileName(product.slug) }
}
