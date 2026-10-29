import type { Payload } from 'payload'
import type { Product } from '../../payload-types'
import {
  AUTODESK_KEEP,
  AUTODESK_NEW,
  AUTODESK_RENAMES,
  COLLECTION_CONTENTS,
  hideAutodesk,
  PICKER_PRODUCTS,
  withContents,
} from '../domain/autodeskCatalogSeed.mjs'
import { relId, relIds } from './rel'

/**
 * Каталог Autodesk по решению владельца 29.10.2026, разово при сборке: остаются три коллекции
 * (AEC, PDMC, M&E) и программы из AEC и PDMC, остальное ПО Autodesk — в черновики; новые
 * Revit LT (вариант в подборе Revit), Robot Structural Analysis, Fusion для дизайна и для
 * производства; в подборе AutoCAD и Revit — только сам продукт и его LT; состав коллекций.
 */
export const AUTODESK_CATALOG_KEY = 'catalog-setup:autodesk-collections-2026-10-29'
const opts = { overrideAccess: true, depth: 0 } as const

type Ctx = { payload: Payload; report: string[] }

/** Разделы товара — с каждой правкой, иначе хук пересчитает их по правилам. */
const keepSections = (product: Product) => ({
  mainSection: relId(product.mainSection),
  extraSections: relIds(product.extraSections),
})

async function autodeskProducts(payload: Payload): Promise<Product[]> {
  const vendors = await payload.find({
    collection: 'manufacturers',
    where: { title: { equals: 'Autodesk' } },
    limit: 1,
    ...opts,
  })
  const vendor = vendors.docs[0]
  if (!vendor) return []
  const { docs } = await payload.find({
    collection: 'products',
    where: { manufacturer: { equals: vendor.id } },
    pagination: false,
    ...opts,
  })
  return docs
}

/** Новые товары по образцу; уже созданные не трогаем. */
async function createNew(ctx: Ctx, products: Product[]) {
  for (const seed of AUTODESK_NEW) {
    if (products.some((p) => p.slug === seed.slug)) continue
    const source = products.find((p) => p.slug === seed.copyFrom)
    if (!source) {
      ctx.report.push(`${seed.title}: нет образца ${seed.copyFrom} — не создан`)
      continue
    }
    const redirect = seed.pageView === 'none' ? source.id : null
    const created = await ctx.payload.create({
      collection: 'products',
      data: {
        title: seed.title,
        slug: seed.slug,
        status: 'published',
        kind: 'software',
        pageView: seed.pageView,
        redirectTo: redirect,
        scenario: source.scenario,
        priority: source.priority,
        manufacturer: relId(source.manufacturer),
        line: relId(source.line),
        ...keepSections(source),
        searchAliases: seed.aliases,
        summary: seed.summary,
        description: seed.description,
      },
      ...opts,
    })
    products.push(created)
    ctx.report.push(`создан: ${seed.title}`)
  }
}

/** Оставленные — на сайте и со своей страницей там, где она нужна; остальное ПО — в черновики. */
async function applyVisibility(ctx: Ctx, products: Product[]) {
  const hidden: string[] = []
  for (const product of products) {
    const hide = hideAutodesk({ slug: product.slug, kind: product.kind })
    const keep = AUTODESK_KEEP.includes(product.slug)
    const data: Partial<Product> = {}
    if (hide && product.status === 'published') data.status = 'draft'
    if (keep && product.status !== 'published') data.status = 'published'
    // LT комплект теперь отдельная карточка, а не вариант в подборе.
    if (product.slug === 'autocad_revit_lt_suite' && product.pageView === 'none') {
      data.pageView = 'standard'
      data.redirectTo = null
    }
    const rename = AUTODESK_RENAMES[product.slug as keyof typeof AUTODESK_RENAMES]
    if (rename && product.title !== rename.title) {
      data.title = rename.title
      data.searchAliases = [product.searchAliases, rename.aliases].filter(Boolean).join(', ')
      ctx.report.push(`название: ${product.title} → ${rename.title}`)
    }
    if (!Object.keys(data).length) continue
    await ctx.payload.update({
      collection: 'products',
      id: product.id,
      data: { ...data, ...keepSections(product) },
      ...opts,
    })
    if (data.status === 'draft') hidden.push(product.title)
    if (data.status === 'published') ctx.report.push(`снова на сайте: ${product.title}`)
  }
  ctx.report.push(`скрыто ${hidden.length}: ${hidden.join('; ') || '—'}`)
  for (const slug of AUTODESK_KEEP)
    if (!products.some((p) => p.slug === slug)) ctx.report.push(`не найден товар ${slug}`)
}

type Steps = NonNullable<NonNullable<Product['picker']>['steps']>

/** Шаг «Продукт» в подборе AutoCAD и Revit: только сам продукт и его LT. */
async function applyPickers(ctx: Ctx, products: Product[]) {
  const idOf = (slug: string) => products.find((p) => p.slug === slug)?.id ?? null
  for (const [slug, change] of Object.entries(PICKER_PRODUCTS)) {
    const product = products.find((p) => p.slug === slug)
    const steps = product?.picker?.steps
    if (!product || product.pageView !== 'picker' || !steps?.length) {
      ctx.report.push(`подбор ${slug}: нет подбора — не меняли`)
      continue
    }
    const drop = change.drop.map(idOf).filter((id): id is number => id != null)
    const next: Steps = steps.map((step, index) => {
      const items = (step.items ?? []).filter((item) => !drop.includes(relId(item.product) ?? -1))
      // Новые варианты — в первый шаг (там выбирается продукт), если их ещё нет.
      if (index === 0)
        for (const add of change.add) {
          const id = idOf(add.slug)
          if (id == null || items.some((item) => relId(item.product) === id)) continue
          items.push({ product: id, offers: [], label: add.label, note: add.note })
        }
      return { ...step, items }
    })
    await ctx.payload.update({
      collection: 'products',
      id: product.id,
      data: { picker: { ...product.picker, steps: next }, ...keepSections(product) },
      ...opts,
    })
    const names = (next[0]?.items ?? []).map((item) => item.label).join(', ')
    ctx.report.push(`подбор ${product.title}: ${names}`)
  }
}

/** Раздел «Что входит в коллекцию» в описаниях трёх коллекций. */
async function applyContents(ctx: Ctx, products: Product[]) {
  for (const [slug, items] of Object.entries(COLLECTION_CONTENTS)) {
    const product = products.find((p) => p.slug === slug)
    if (!product) continue
    const description = withContents(product.description, items)
    if (description === product.description) continue
    await ctx.payload.update({
      collection: 'products',
      id: product.id,
      data: { description, ...keepSections(product) },
      ...opts,
    })
    ctx.report.push(`${product.title}: состав коллекции (${items.length})`)
  }
}

/** Плитка «Fusion» на главной вела к скрытому Fusion 360 Team — теперь к Fusion Cloud. */
async function repointPopular(ctx: Ctx, products: Product[]) {
  const cloud = products.find((p) => p.slug === 'fusion_360_cloud')
  const page = await ctx.payload.findGlobal({ slug: 'home-page', ...opts })
  const items = page.popular?.items ?? []
  const hiddenIds = new Set(
    products.filter((p) => hideAutodesk({ slug: p.slug, kind: p.kind })).map((p) => p.id),
  )
  if (!cloud || !items.some((item) => hiddenIds.has(relId(item.product) ?? -1))) return
  await ctx.payload.updateGlobal({
    slug: 'home-page',
    data: {
      popular: {
        ...page.popular,
        items: items.map((item) =>
          hiddenIds.has(relId(item.product) ?? -1)
            ? { ...item, product: cloud.id }
            : { ...item, product: relId(item.product) },
        ),
      },
    },
    ...opts,
  })
  ctx.report.push('главная: плитка Fusion ведёт к Fusion Cloud')
}

export async function setupAutodeskCatalog(payload: Payload): Promise<string[] | null> {
  const done = await payload.find({
    collection: 'import-runs',
    where: { idempotencyKey: { equals: AUTODESK_CATALOG_KEY } },
    limit: 1,
    ...opts,
  })
  if (done.docs.length) return null
  const ctx: Ctx = { payload, report: [] }
  const products = await autodeskProducts(payload)
  if (!products.length) return ['нет производителя Autodesk или его товаров — ничего не меняли']
  await createNew(ctx, products)
  await applyVisibility(ctx, products)
  await applyPickers(ctx, await autodeskProducts(payload))
  await applyContents(ctx, products)
  await repointPopular(ctx, products)
  await payload.create({
    collection: 'import-runs',
    data: { idempotencyKey: AUTODESK_CATALOG_KEY, state: 'done', snapshot: { report: ctx.report } },
    ...opts,
  })
  return ctx.report
}
