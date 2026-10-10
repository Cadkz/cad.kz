import type { Payload } from 'payload'
import { FAMILY_VENDORS, planFamilies } from '../domain/familySeed.mjs'
import { relId } from './rel'

/** Ключ записи в журнале «Запуски импорта»: настройка выполняется один раз. */
export const FAMILIES_SETUP_V5_KEY = 'catalog-setup:families-v5'
const opts = { overrideAccess: true, depth: 0 } as const

type Report = { families: string[]; products: number; skipped: string[]; unmatched: string[] }

/**
 * Семейства редких товаров CSoft, MagiCAD, НТП Трубопровод, Chaos, АСКОН (`familySeed.mjs`):
 * линейка со своей страницей на каждое семейство, товарам — линейка, порядок и вид «Без своей
 * страницы». Товар с подбором или с уже выбранной линейкой не трогаем. Один раз (отметка в журнале).
 */
export async function setupFamiliesV5(payload: Payload): Promise<Report | null> {
  const done = await payload.find({
    collection: 'import-runs',
    where: { idempotencyKey: { equals: FAMILIES_SETUP_V5_KEY } },
    limit: 1,
    ...opts,
  })
  if (done.docs.length) return null
  const report: Report = { families: [], products: 0, skipped: [], unmatched: [] }
  const vendors = await payload.find({
    collection: 'manufacturers',
    where: { title: { in: FAMILY_VENDORS } },
    pagination: false,
    ...opts,
  })
  const vendorName = new Map(vendors.docs.map((v) => [v.id, v.title]))
  const vendorId = new Map(vendors.docs.map((v) => [v.title, v.id]))
  const products = vendors.docs.length
    ? await payload.find({
        collection: 'products',
        where: { manufacturer: { in: vendors.docs.map((v) => v.id) } },
        pagination: false,
        select: { title: true, manufacturer: true, line: true, pageView: true },
        ...opts,
      })
    : { docs: [] }
  const plan = planFamilies(
    products.docs.map((p) => ({
      id: p.id,
      title: p.title,
      vendor: vendorName.get(relId(p.manufacturer) ?? -1) ?? '',
      skip: p.pageView === 'picker' || relId(p.line) != null,
    })),
  )
  report.skipped = products.docs
    .filter((p) => p.pageView === 'picker' || relId(p.line) != null)
    .map((p) => p.title)
  report.unmatched = plan.unmatched.map((u) => `${u.vendor}: ${u.title}`)

  for (const [index, family] of plan.families.entries()) {
    const vendor = vendorId.get(family.vendor)
    if (vendor == null) continue
    const found = await payload.find({
      collection: 'product-lines',
      where: { slug: { equals: family.slug } },
      limit: 1,
      ...opts,
    })
    const data = {
      title: family.title,
      manufacturer: vendor,
      order: (index + 1) * 10,
      familyPage: true,
      slug: family.slug,
      intro: family.intro,
      status: 'published' as const,
    }
    const line = found.docs[0]
      ? await payload.update({ collection: 'product-lines', id: found.docs[0].id, data, ...opts })
      : await payload.create({ collection: 'product-lines', data, ...opts })
    for (const member of family.members) {
      await payload.update({
        collection: 'products',
        id: member.id,
        data: { line: line.id, lineOrder: member.order, pageView: 'none' },
        ...opts,
      })
    }
    report.products += family.members.length
    report.families.push(`/families/${family.slug} (${family.members.length})`)
  }

  await payload.create({
    collection: 'import-runs',
    data: { idempotencyKey: FAMILIES_SETUP_V5_KEY, state: 'done', snapshot: report },
    ...opts,
  })
  return report
}
