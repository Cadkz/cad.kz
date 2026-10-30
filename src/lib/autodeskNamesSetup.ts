import type { Payload } from 'payload'
import type { Product } from '../../payload-types'
import {
  NAME_FIXES,
  NAVISWORKS_MANAGE,
  NAVISWORKS_SIMULATE,
  navisworksProperties,
} from '../domain/autodeskNamesSeed.mjs'
import { relId, relIds } from './rel'

/**
 * Правки владельца 29.10.2026, разово при сборке: Fusion for Design / for Manufacturing,
 * Navisworks → Navisworks Manage и новый товар Navisworks Simulate рядом с ним.
 */
export const AUTODESK_NAMES_KEY = 'catalog-setup:autodesk-names-2026-10-29'
const opts = { overrideAccess: true, depth: 0 } as const

/**
 * Разделы товара — с каждой правкой. При смене названия правила разделов пересчитали бы их,
 * поэтому подбор по правилам выключается: раздел остаётся тем, что был.
 */
const fixedSections = (product: Product) => ({
  autoSections: false,
  mainSection: relId(product.mainSection),
  extraSections: relIds(product.extraSections),
})

const plainProps = (product: Product) =>
  (product.properties ?? []).map(({ name, value }) => ({ name, value }))

export async function setupAutodeskNames(payload: Payload): Promise<string[] | null> {
  const done = await payload.find({
    collection: 'import-runs',
    where: { idempotencyKey: { equals: AUTODESK_NAMES_KEY } },
    limit: 1,
    ...opts,
  })
  if (done.docs.length) return null
  const report: string[] = []
  const slugs = [...Object.keys(NAME_FIXES), NAVISWORKS_SIMULATE.slug]
  const { docs } = await payload.find({
    collection: 'products',
    where: { slug: { in: slugs } },
    pagination: false,
    ...opts,
  })
  const bySlug = new Map(docs.map((product) => [product.slug, product]))

  for (const [slug, fix] of Object.entries(NAME_FIXES)) {
    const product = bySlug.get(slug)
    if (!product) {
      report.push(`не найден товар ${slug}`)
      continue
    }
    const navis = slug === NAVISWORKS_MANAGE.slug
    await payload.update({
      collection: 'products',
      id: product.id,
      data: {
        title: fix.title,
        searchAliases: [product.searchAliases, fix.aliases].filter(Boolean).join(', '),
        ...(navis
          ? {
              summary: NAVISWORKS_MANAGE.summary,
              description: NAVISWORKS_MANAGE.description,
              properties: navisworksProperties(plainProps(product), 'Manage'),
            }
          : {}),
        ...fixedSections(product),
      },
      ...opts,
    })
    report.push(`${product.title} → ${fix.title}`)
  }

  const manage = bySlug.get(NAVISWORKS_MANAGE.slug)
  if (manage && !bySlug.has(NAVISWORKS_SIMULATE.slug)) {
    await payload.create({
      collection: 'products',
      data: {
        title: NAVISWORKS_SIMULATE.title,
        slug: NAVISWORKS_SIMULATE.slug,
        status: 'published',
        kind: 'software',
        pageView: 'standard',
        scenario: manage.scenario,
        priority: manage.priority,
        manufacturer: relId(manage.manufacturer),
        line: relId(manage.line),
        lineOrder: manage.lineOrder,
        searchAliases: NAVISWORKS_SIMULATE.aliases,
        summary: NAVISWORKS_SIMULATE.summary,
        description: NAVISWORKS_SIMULATE.description,
        properties: navisworksProperties(plainProps(manage), 'Simulate'),
        ...fixedSections(manage),
      },
      ...opts,
    })
    report.push('создан: Navisworks Simulate (без цены — запрос)')
  }

  await payload.create({
    collection: 'import-runs',
    data: { idempotencyKey: AUTODESK_NAMES_KEY, state: 'done', snapshot: { report } },
    ...opts,
  })
  return report
}
