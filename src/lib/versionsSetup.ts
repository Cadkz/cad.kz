import type { Payload } from 'payload'
import type { Product } from '../../payload-types'
import {
  applyPairs,
  FAMILY_FIXES,
  isDraftByVersion,
  OFFER_FIXES,
  PRODUCT_FIXES,
} from '../domain/versionsSeed.mjs'

/** Ключ записи в журнале «Запуски импорта»: настройка выполняется один раз. */
export const VERSIONS_SETUP_KEY = 'catalog-setup:versions-v3'
const opts = { overrideAccess: true, depth: 0 } as const

type Pair = [string, string]
type Report = {
  products: string[]
  offers: number
  drafts: string[]
  families: string[]
  missing: string[]
}

/** Поля товара с заменёнными версиями; пусто — менять нечего. */
function fixedProduct(product: Product, pairs: Pair[], summary?: string) {
  const data: Partial<Product> = {}
  const title = applyPairs(product.title, pairs) ?? product.title
  if (title !== product.title) data.title = title
  const nextSummary = product.summary ? applyPairs(product.summary, pairs) : (summary ?? null)
  if (nextSummary !== (product.summary ?? null)) data.summary = nextSummary
  const description = applyPairs(product.description, pairs)
  if (description !== product.description) data.description = description
  const properties = (product.properties ?? []).map((row) => ({
    ...row,
    value: applyPairs(row.value, pairs) ?? row.value,
  }))
  if (properties.some((row, i) => row.value !== product.properties?.[i]?.value))
    data.properties = properties
  if (product.seo) {
    const seo = {
      ...product.seo,
      title: applyPairs(product.seo.title, pairs),
      description: applyPairs(product.seo.description, pairs),
    }
    if (seo.title !== product.seo.title || seo.description !== product.seo.description)
      data.seo = seo
  }
  return data
}

async function productBySlug(payload: Payload, slug: string) {
  const found = await payload.find({
    collection: 'products',
    where: { slug: { equals: slug } },
    limit: 1,
    ...opts,
  })
  return found.docs[0]
}

async function fixProducts(payload: Payload, report: Report) {
  for (const fix of PRODUCT_FIXES) {
    const product = await productBySlug(payload, fix.slug)
    if (!product) {
      report.missing.push(`товар ${fix.slug}`)
      continue
    }
    const data = fixedProduct(product, fix.pairs as Pair[], fix.summary)
    if (!Object.keys(data).length) continue
    await payload.update({ collection: 'products', id: product.id, data, ...opts })
    report.products.push(data.title ?? product.title)
  }
}

async function fixOffers(payload: Payload, report: Report) {
  for (const fix of OFFER_FIXES) {
    const product = await productBySlug(payload, fix.slug)
    if (!product) {
      report.missing.push(`предложения товара ${fix.slug}`)
      continue
    }
    const { docs } = await payload.find({
      collection: 'offers',
      where: { product: { equals: product.id } },
      pagination: false,
      ...opts,
    })
    const pairs = fix.pairs as Pair[]
    for (const offer of docs) {
      const title = applyPairs(offer.title, pairs) ?? offer.title
      const configuration = applyPairs(offer.configuration, pairs) ?? offer.configuration
      if (title === offer.title && configuration === offer.configuration) continue
      await payload.update({
        collection: 'offers',
        id: offer.id,
        data: { title, configuration },
        ...opts,
      })
      report.offers++
    }
  }
}

/** Старые версии и снятые с продажи программы — в черновики (старый адрес ведёт на производителя). */
async function draftOld(payload: Payload, report: Report) {
  const vendors = await payload.find({ collection: 'manufacturers', pagination: false, ...opts })
  const vendorTitle = new Map(vendors.docs.map((m) => [m.id, m.title]))
  const { docs } = await payload.find({
    collection: 'products',
    where: { status: { equals: 'published' } },
    pagination: false,
    select: { title: true, manufacturer: true },
    ...opts,
  })
  for (const product of docs) {
    const vendor = vendorTitle.get(Number(product.manufacturer)) ?? ''
    if (!isDraftByVersion({ title: product.title, vendor })) continue
    await payload.update({
      collection: 'products',
      id: product.id,
      data: { status: 'draft' },
      ...opts,
    })
    report.drafts.push(product.title)
  }
}

async function fixFamilies(payload: Payload, report: Report) {
  const intros: Record<string, string> = FAMILY_FIXES.intros
  const slugs = [...FAMILY_FIXES.drafts, ...Object.keys(intros)]
  const { docs } = await payload.find({
    collection: 'product-lines',
    where: { slug: { in: slugs } },
    pagination: false,
    ...opts,
  })
  for (const line of docs) {
    const slug = line.slug ?? ''
    const draft = FAMILY_FIXES.drafts.includes(slug)
    await payload.update({
      collection: 'product-lines',
      id: line.id,
      data: draft ? { status: 'draft' } : { intro: intros[slug] },
      ...opts,
    })
    report.families.push(`${slug}: ${draft ? 'в черновики' : 'новое описание'}`)
  }
}

/**
 * Актуализация версий по сайтам производителей (10.10.2026). Выполняется один раз: отметка —
 * запись в журнале «Запуски импорта». Адреса товаров не меняются.
 */
export async function setupVersions(payload: Payload): Promise<Report | null> {
  const done = await payload.find({
    collection: 'import-runs',
    where: { idempotencyKey: { equals: VERSIONS_SETUP_KEY } },
    limit: 1,
    ...opts,
  })
  if (done.docs.length) return null
  const report: Report = { products: [], offers: 0, drafts: [], families: [], missing: [] }
  await fixProducts(payload, report)
  await fixOffers(payload, report)
  await draftOld(payload, report)
  await fixFamilies(payload, report)
  await payload.create({
    collection: 'import-runs',
    data: { idempotencyKey: VERSIONS_SETUP_KEY, state: 'done', snapshot: report },
    ...opts,
  })
  return report
}
