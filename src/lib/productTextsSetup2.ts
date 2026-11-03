import type { Payload } from 'payload'
import type { Product } from '../../payload-types'
import { ownCardText, summaryPhrase } from '../domain/cardTexts.mjs'
import { nextText } from '../domain/productTextFixes.mjs'
import {
  fixedTitle,
  GENERIC_SEO,
  isRetired,
  OFFER_RENAMES_2,
  PRODUCT_TEXTS_2,
  RETIRED_OFFER,
  seoFromPhrase,
  stage2Description,
  summaryFromPhrase,
} from '../domain/productTextFixes2.mjs'
import { titleDash } from '../domain/titleDash.mjs'

/** Ключ записи в журнале «Запуски импорта»: настройка выполняется один раз. */
export const PRODUCT_TEXTS_2_SETUP_KEY = 'catalog-setup:product-texts-2-2026-11-03'
const opts = { overrideAccess: true, depth: 0 } as const

type Related = number | { title?: string | null } | null | undefined
const relTitle = (value: Related) =>
  value && typeof value === 'object' ? (value.title ?? null) : null

/** Новые тексты по списку PRODUCT_TEXTS_2: только поля, где в базе ещё старый текст. */
function listedTexts(product: Product): Partial<Product> {
  const entry = PRODUCT_TEXTS_2.find((item) => item.slug === product.slug)
  if (!entry) return {}
  const data: Partial<Product> = {}
  if (entry.title && product.title === entry.title.from) data.title = entry.title.to
  const summary = nextText(product.summary, entry.summary)
  if (summary != null) data.summary = summary
  const description = nextText(product.description, entry.description)
  if (description != null) data.description = description
  const seo = nextText(product.seo?.description, entry.seo)
  if (seo != null) data.seo = { ...product.seo, description: seo }
  return data
}

/** Фраза карточки: своя из списка → пояснение после тире в названии → первая фраза анонса. */
function cardPhrase(slug: string, title: string, summary: string | null | undefined) {
  const dash = titleDash(title)
  return ownCardText(slug) ?? dash?.rest ?? summaryPhrase(summary, dash?.name ?? title)
}

/** Все правки этапа 2 одного товара (без статуса). */
export function productChanges2(product: Product): Partial<Product> {
  const data = listedTexts(product)
  const vendor = relTitle(product.manufacturer)
  const title = fixedTitle(data.title ?? product.title, { line: relTitle(product.line) })
  if (title !== product.title) data.title = title
  const description = data.description ?? product.description
  if (description) {
    const fixed = stage2Description(description, { vendor, slug: product.slug })
    if (fixed !== product.description) data.description = fixed
  }
  const summary = data.summary ?? product.summary
  if (!summary?.trim()) {
    const filled = summaryFromPhrase(ownCardText(product.slug))
    if (filled) data.summary = filled
  }
  if ((product.seo?.description ?? '').startsWith(GENERIC_SEO)) {
    const name = titleDash(title)?.name ?? title
    const phrase = cardPhrase(product.slug, title, data.summary ?? product.summary)
    data.seo = {
      ...product.seo,
      description: seoFromPhrase({ title: name, kind: product.kind, phrase }),
    }
  }
  if (data.title && product.seo?.title?.includes(product.title))
    data.seo = {
      ...product.seo,
      ...data.seo,
      title: product.seo.title.replace(product.title, data.title),
    }
  return data
}

async function fixProducts(payload: Payload, report: string[]) {
  const { docs } = await payload.find({
    collection: 'products',
    pagination: false,
    ...opts,
    depth: 1,
  })
  for (const slug of PRODUCT_TEXTS_2.map((item) => item.slug))
    if (!docs.some((doc) => doc.slug === slug)) report.push(`Не найден товар ${slug}`)
  let seo = 0
  // По одному: хук заполненности открывает своё соединение с базой (HANDOFF, 31.10, ночь (2)).
  for (const product of docs) {
    const data: Partial<Product> = productChanges2(product)
    if (product.status === 'published' && isRetired(product)) data.status = 'draft'
    const fields = Object.keys(data)
    if (!fields.length) continue
    await payload.update({ collection: 'products', id: product.id, data, ...opts })
    if (fields.length === 1 && fields[0] === 'seo') seo += 1
    else report.push(`${product.title}: ${fields.join(', ')}`)
  }
  if (seo) report.push(`SEO-описание из фразы карточки: ещё ${seo} товаров`)
}

async function fixOffers(payload: Payload, report: string[]) {
  const slugs = [...new Set(OFFER_RENAMES_2.map(([slug]) => slug))]
  const { docs: products } = await payload.find({
    collection: 'products',
    where: { slug: { in: slugs } },
    pagination: false,
    select: { slug: true },
    ...opts,
  })
  const idBySlug = new Map(products.map((product) => [product.slug, product.id]))
  const { docs } = await payload.find({ collection: 'offers', pagination: false, ...opts })
  for (const offer of docs) {
    const productId = typeof offer.product === 'object' ? offer.product?.id : offer.product
    const rename = OFFER_RENAMES_2.find(
      ([slug, from]) => idBySlug.get(slug) === productId && offer.configuration === from,
    )
    if (rename) {
      await payload.update({
        collection: 'offers',
        id: offer.id,
        data: { configuration: rename[2] },
        ...opts,
      })
      report.push(`Комплектация «${offer.configuration}» → «${rename[2]}»`)
    } else if (offer.configuration === RETIRED_OFFER && offer.status === 'published') {
      await payload.update({
        collection: 'offers',
        id: offer.id,
        data: { status: 'draft' },
        ...opts,
      })
      report.push(`Комплектация «${RETIRED_OFFER}» (id ${offer.id}) — в черновик`)
    }
  }
}

/**
 * Сверка текстов, этап 2 (src/domain/productTextFixes2.mjs). Один раз (отметка в журнале
 * «Запуски импорта»), отчёт — в той же записи.
 */
export async function setupProductTexts2(payload: Payload): Promise<string[] | null> {
  const done = await payload.find({
    collection: 'import-runs',
    where: { idempotencyKey: { equals: PRODUCT_TEXTS_2_SETUP_KEY } },
    limit: 1,
    ...opts,
  })
  if (done.docs.length) return null
  const report: string[] = []
  await fixProducts(payload, report)
  await fixOffers(payload, report)
  await payload.create({
    collection: 'import-runs',
    data: { idempotencyKey: PRODUCT_TEXTS_2_SETUP_KEY, state: 'done', snapshot: { report } },
    ...opts,
  })
  return report
}
