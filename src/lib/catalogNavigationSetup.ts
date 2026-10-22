import type { Payload } from 'payload'
import { CATALOG_CATEGORIES } from '../domain/catalogNavigation.mjs'

const KEY = 'catalog-setup:navigation-v1'
const opts = { overrideAccess: true, depth: 0 } as const

/** Меняет только названия/пояснения разделов: не переименовывает товары и не переносит их. */
export async function setupCatalogNavigation(payload: Payload): Promise<string[] | null> {
  const done = await payload.find({
    collection: 'import-runs',
    where: { idempotencyKey: { equals: KEY } },
    limit: 1,
    ...opts,
  })
  if (done.docs.length) return null
  const sections = (await payload.find({ collection: 'sections', pagination: false, ...opts })).docs
  const report: string[] = []
  for (const seed of CATALOG_CATEGORIES) {
    const section = sections.find((entry) => entry.slug === seed.slug)
    if (!section) {
      report.push(`Раздел ${seed.slug} отсутствует — пропущен`)
      continue
    }
    await payload.update({
      collection: 'sections',
      id: section.id,
      data: { title: seed.title, summary: seed.summary },
      ...opts,
    })
    report.push(`${section.title} → ${seed.title}`)
  }
  await payload.create({
    collection: 'import-runs',
    data: { idempotencyKey: KEY, state: 'done', snapshot: { report } },
    ...opts,
  })
  return report
}
