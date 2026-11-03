import type { Payload } from 'payload'
import type { Product } from '../../payload-types'
import {
  applyTextEdits,
  nextText,
  OFFER_RENAMES,
  PRODUCT_TEXTS,
} from '../domain/productTextFixes.mjs'
import { fixMixedScripts } from '../domain/textCleanup.mjs'
import { cleanedProduct } from './cardsSetup'

/** Ключ записи в журнале «Запуски импорта»: настройка выполняется один раз. */
export const PRODUCT_TEXTS_SETUP_KEY = 'catalog-setup:product-texts-2026-11-03-2'
const opts = { overrideAccess: true, depth: 0 } as const

/** Новые тексты по списку PRODUCT_TEXTS: только поля, где в базе ещё старый текст. */
function listedTexts(product: Product): Partial<Product> {
  const entry = PRODUCT_TEXTS.find((item) => item.slug === product.slug)
  if (!entry) return {}
  const data: Partial<Product> = {}
  if (entry.title && product.title === entry.title.from) data.title = entry.title.to
  const summary = nextText(product.summary, entry.summary)
  if (summary != null) data.summary = summary
  const description = nextText(product.description, entry.description)
  if (description != null) data.description = description
  const seoDescription = nextText(product.seo?.description, entry.seo)
  const rename = entry.seoTitle ?? entry.title
  const seoTitle =
    rename && product.seo?.title?.includes(rename.from)
      ? product.seo.title.replace(rename.from, rename.to)
      : null
  if (seoDescription != null || seoTitle != null)
    data.seo = {
      ...product.seo,
      ...(seoTitle != null ? { title: seoTitle } : {}),
      ...(seoDescription != null ? { description: seoDescription } : {}),
    }
  return data
}

/** Все правки одного товара: новые тексты, точечные замены, буквы-двойники и склейки. */
export function productTextChanges(product: Product): Partial<Product> {
  const listed = listedTexts(product)
  const merged: Product = { ...product, ...listed }
  const description = merged.description ? applyTextEdits(merged.description) : merged.description
  const edited: Product = { ...merged, description }
  const cleaned = cleanedProduct(edited)
  const data: Partial<Product> = { ...listed, ...cleaned }
  if (cleaned.description == null && description !== product.description)
    data.description = description
  return data
}

async function fixProducts(payload: Payload, report: string[]) {
  const { docs } = await payload.find({ collection: 'products', pagination: false, ...opts })
  for (const slug of PRODUCT_TEXTS.map((item) => item.slug))
    if (!docs.some((doc) => doc.slug === slug)) report.push(`Не найден товар ${slug}`)
  // По одному: хук заполненности открывает своё соединение с базой (HANDOFF, 31.10, ночь (2)).
  for (const product of docs) {
    const data = productTextChanges(product)
    const fields = Object.keys(data)
    if (!fields.length) continue
    await payload.update({ collection: 'products', id: product.id, data, ...opts })
    report.push(`${product.title}: ${fields.join(', ')}`)
  }
}

async function fixOffers(payload: Payload, report: string[]) {
  const { docs: products } = await payload.find({
    collection: 'products',
    where: { slug: { in: [...new Set(OFFER_RENAMES.map(([slug]) => slug))] } },
    pagination: false,
    select: { slug: true },
    ...opts,
  })
  const idBySlug = new Map(products.map((product) => [product.slug, product.id]))
  const { docs } = await payload.find({ collection: 'offers', pagination: false, ...opts })
  for (const offer of docs) {
    const productId = typeof offer.product === 'object' ? offer.product?.id : offer.product
    const rename = OFFER_RENAMES.find(
      ([slug, from]) => idBySlug.get(slug) === productId && offer.configuration === from,
    )
    const configuration = rename ? rename[2] : fixMixedScripts(offer.configuration)
    if (configuration === offer.configuration) continue
    await payload.update({ collection: 'offers', id: offer.id, data: { configuration }, ...opts })
    report.push(`Комплектация «${offer.configuration}» → «${configuration}»`)
  }
}

/**
 * Сверка текстов товаров после презентации 03.11.2026 (src/domain/productTextFixes.mjs).
 * Один раз (отметка в журнале «Запуски импорта»), отчёт — в той же записи.
 */
export async function setupProductTexts(payload: Payload): Promise<string[] | null> {
  const done = await payload.find({
    collection: 'import-runs',
    where: { idempotencyKey: { equals: PRODUCT_TEXTS_SETUP_KEY } },
    limit: 1,
    ...opts,
  })
  if (done.docs.length) return null
  const report: string[] = []
  await fixProducts(payload, report)
  await fixOffers(payload, report)
  await payload.create({
    collection: 'import-runs',
    data: { idempotencyKey: PRODUCT_TEXTS_SETUP_KEY, state: 'done', snapshot: { report } },
    ...opts,
  })
  return report
}
