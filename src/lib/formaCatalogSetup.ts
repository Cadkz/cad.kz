import type { Payload } from 'payload'
import type { Product, ProductLine } from '../../payload-types'
import {
  AUTODESK_LINES,
  autodeskLineOf,
  COLLECTION_SLUGS,
  DATA_MANAGEMENT_SLUG,
  FORMA_PRODUCTS,
} from '../domain/formaCatalogSeed.mjs'
import { relId, relIds } from './rel'

/**
 * Autodesk Forma по решению владельца 29.10.2026, разово при сборке: Autodesk Docs →
 * Forma Data Management (снова на сайте), новые Forma Site Design и Forma Building Design;
 * у Autodesk три линейки — «Программы», «Коллекции», «Autodesk Forma».
 */
export const FORMA_CATALOG_KEY = 'catalog-setup:autodesk-forma-2026-10-29'
const opts = { overrideAccess: true, depth: 0 } as const

type Ctx = { payload: Payload; report: string[] }
type LineKey = keyof typeof AUTODESK_LINES

/** Разделы товара — с каждой правкой, иначе хук пересчитает их по правилам. */
const keepSections = (product: Product) => ({
  mainSection: relId(product.mainSection),
  extraSections: relIds(product.extraSections),
})

async function autodeskVendor(payload: Payload) {
  const { docs } = await payload.find({
    collection: 'manufacturers',
    where: { title: { equals: 'Autodesk' } },
    limit: 1,
    ...opts,
  })
  return docs[0] ?? null
}

async function vendorProducts(payload: Payload, vendor: number): Promise<Product[]> {
  const { docs } = await payload.find({
    collection: 'products',
    where: { manufacturer: { equals: vendor } },
    pagination: false,
    ...opts,
  })
  return docs
}

/** Data Management — переименование и снова на сайте; Site и Building Design — новые. */
async function applyProducts(ctx: Ctx, products: Product[]) {
  const source = products.find((p) => p.slug === DATA_MANAGEMENT_SLUG)
  const aec = products.find((p) => p.slug === COLLECTION_SLUGS[0])
  if (!source || !aec) {
    ctx.report.push('нет Autodesk Docs или AEC Collection — Forma не настроена')
    return
  }
  // Раздел — как у AEC Collection (архитектура и BIM), без правил: по названию «Forma» правила
  // разделов не сработают, а у Autodesk Docs был раздел смет.
  const sections = {
    autoSections: false,
    mainSection: relId(aec.mainSection),
    extraSections: [],
  }
  for (const seed of FORMA_PRODUCTS) {
    const texts = {
      title: seed.title,
      searchAliases: seed.aliases,
      summary: seed.summary,
      description: seed.description,
    }
    const found = products.find((p) => p.slug === seed.slug)
    if (found) {
      const searchAliases = [found.searchAliases, seed.aliases].filter(Boolean).join(', ')
      await ctx.payload.update({
        collection: 'products',
        id: found.id,
        data: {
          ...texts,
          searchAliases,
          status: 'published',
          pageView: 'standard',
          redirectTo: null,
          ...sections,
        },
        ...opts,
      })
      ctx.report.push(`${found.title} → ${seed.title}, на сайте`)
      continue
    }
    if (!seed.isNew) continue
    await ctx.payload.create({
      collection: 'products',
      data: {
        ...texts,
        slug: seed.slug,
        status: 'published',
        kind: 'software',
        pageView: 'standard',
        scenario: source.scenario,
        priority: source.priority,
        manufacturer: relId(source.manufacturer),
        ...sections,
      },
      ...opts,
    })
    ctx.report.push(`создан: ${seed.title}`)
  }
}

/** Линейка Autodesk по названию: есть — обновляем порядок, нет — создаём. */
async function ensureLine(ctx: Ctx, vendor: number, key: LineKey): Promise<ProductLine> {
  const seed = AUTODESK_LINES[key]
  const found = await ctx.payload.find({
    collection: 'product-lines',
    where: { and: [{ manufacturer: { equals: vendor } }, { title: { equals: seed.title } }] },
    limit: 1,
    ...opts,
  })
  const summary = 'summary' in seed ? seed.summary : undefined
  const data = { title: seed.title, manufacturer: vendor, order: seed.order, summary }
  const existing = found.docs[0]
  if (existing)
    return ctx.payload.update({ collection: 'product-lines', id: existing.id, data, ...opts })
  ctx.report.push(`линейка: ${seed.title}`)
  return ctx.payload.create({
    collection: 'product-lines',
    data: { ...data, status: 'published' },
    ...opts,
  })
}

/** Программы Autodesk без линейки — по линейкам; Forma — по порядку из списка. */
async function applyLines(ctx: Ctx, vendor: number, products: Product[]) {
  const ids = {} as Record<LineKey, number>
  for (const key of Object.keys(AUTODESK_LINES) as LineKey[])
    ids[key] = (await ensureLine(ctx, vendor, key)).id
  const counts: Record<LineKey, number> = { programs: 0, collections: 0, forma: 0 }
  for (const product of products) {
    const key = autodeskLineOf({
      slug: product.slug,
      kind: product.kind,
      status: product.status ?? 'draft',
      line: relId(product.line),
    })
    if (!key) continue
    const formaIndex = FORMA_PRODUCTS.findIndex((entry) => entry.slug === product.slug)
    await ctx.payload.update({
      collection: 'products',
      id: product.id,
      data: {
        line: ids[key],
        ...(formaIndex >= 0 ? { lineOrder: formaIndex + 1 } : {}),
        ...keepSections(product),
      },
      ...opts,
    })
    counts[key] += 1
  }
  for (const key of Object.keys(counts) as LineKey[])
    ctx.report.push(`${AUTODESK_LINES[key].title} — товаров: ${counts[key]}`)
}

export async function setupFormaCatalog(payload: Payload): Promise<string[] | null> {
  const done = await payload.find({
    collection: 'import-runs',
    where: { idempotencyKey: { equals: FORMA_CATALOG_KEY } },
    limit: 1,
    ...opts,
  })
  if (done.docs.length) return null
  const vendor = await autodeskVendor(payload)
  if (!vendor) return ['нет производителя Autodesk — ничего не меняли']
  const ctx: Ctx = { payload, report: [] }
  await applyProducts(ctx, await vendorProducts(payload, vendor.id))
  await applyLines(ctx, vendor.id, await vendorProducts(payload, vendor.id))
  await payload.create({
    collection: 'import-runs',
    data: { idempotencyKey: FORMA_CATALOG_KEY, state: 'done', snapshot: { report: ctx.report } },
    ...opts,
  })
  return ctx.report
}
