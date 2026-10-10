import type { Payload } from 'payload'
import {
  FAMILY_VENDORS,
  licenseVariants,
  OPTION_RULES,
  planExtras,
  planFamilies,
  usedLicenseSwitches,
} from '../domain/familySeed.mjs'
import { relId } from './rel'

/** Ключ записи в журнале «Запуски импорта»: настройка выполняется один раз. */
export const FAMILIES_SETUP_V5_KEY = 'catalog-setup:families-v5'
const opts = { overrideAccess: true, depth: 0 } as const

type Report = {
  families: string[]
  products: number
  lines: string[]
  options: number
  drafts: number
  skipped: string[]
  unmatched: string[]
}

/**
 * Семейства редких товаров CSoft, MagiCAD, НТП Трубопровод, Chaos, АСКОН (`familySeed.mjs`):
 * линейка со своей страницей на каждое семейство, товарам — линейка, порядок и вид «Без своей
 * страницы». Model Studio CS и MagiCAD — группы без своей страницы, продления и комплекты Suite —
 * вариантами на странице программы. PlanTracer — в черновики. Товар с подбором или с уже
 * выбранной линейкой и черновики не трогаем. Один раз (отметка в журнале).
 */
export async function setupFamiliesV5(payload: Payload): Promise<Report | null> {
  const done = await payload.find({
    collection: 'import-runs',
    where: { idempotencyKey: { equals: FAMILIES_SETUP_V5_KEY } },
    limit: 1,
    ...opts,
  })
  if (done.docs.length) return null
  const report: Report = {
    families: [],
    products: 0,
    lines: [],
    options: 0,
    drafts: 0,
    skipped: [],
    unmatched: [],
  }
  const vendors = await payload.find({
    collection: 'manufacturers',
    where: {
      title: { in: [...new Set([...FAMILY_VENDORS, ...OPTION_RULES.map((r) => r.vendor)])] },
    },
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
        select: { title: true, manufacturer: true, line: true, pageView: true, status: true },
        ...opts,
      })
    : { docs: [] }
  // Черновики (скрытые демотовары, снятые с продажи) не раскладываем.
  const brief = products.docs
    .filter((p) => p.status !== 'draft')
    .map((p) => ({
      id: p.id,
      title: p.title,
      vendor: vendorName.get(relId(p.manufacturer) ?? -1) ?? '',
      skip: p.pageView === 'picker' || relId(p.line) != null,
    }))
  const plan = planFamilies(brief)
  const inFamily = new Set(plan.families.flatMap((f) => f.members.map((m) => m.id)))
  const extras = planExtras(brief.map((p) => ({ ...p, skip: p.skip || inFamily.has(p.id) })))
  const handled = new Set([
    ...extras.lines.flatMap((l) => l.ids),
    ...extras.noPage,
    ...extras.drafts,
  ])
  report.skipped = products.docs
    .filter((p) => p.pageView === 'picker' || relId(p.line) != null)
    .map((p) => p.title)
  report.unmatched = plan.unmatched
    .filter((u) => !handled.has(u.id))
    .map((u) => `${u.vendor}: ${u.title}`)

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

  for (const [index, group] of extras.lines.entries()) {
    const vendor = vendorId.get(group.vendor)
    if (vendor == null) continue
    const found = await payload.find({
      collection: 'product-lines',
      where: { and: [{ manufacturer: { equals: vendor } }, { title: { equals: group.title } }] },
      limit: 1,
      ...opts,
    })
    const data = {
      title: group.title,
      manufacturer: vendor,
      order: (index + 1) * 10,
      status: 'published' as const,
    }
    const line = found.docs[0]
      ? await payload.update({ collection: 'product-lines', id: found.docs[0].id, data, ...opts })
      : await payload.create({ collection: 'product-lines', data, ...opts })
    for (const [order, id] of group.ids.entries())
      await payload.update({
        collection: 'products',
        id,
        data: { line: line.id, lineOrder: order + 1 },
        ...opts,
      })
    report.lines.push(`${group.title} (${group.ids.length})`)
  }

  for (const option of extras.options) {
    // Вид и срок лицензии — переключатели: значения у предложений обеих программ (уже
    // заполненные не трогаем), в переключателях — только встречающиеся значения.
    let switches: ReturnType<typeof usedLicenseSwitches> = []
    if (option.licenseSwitches) {
      const offers = await payload.find({
        collection: 'offers',
        where: { product: { in: option.items.map((item) => item.productId) } },
        pagination: false,
        ...opts,
      })
      const all: string[][] = []
      for (const offer of offers.docs) {
        const variants = offer.variants?.length ? offer.variants : licenseVariants(offer.license)
        all.push(variants)
        if (!offer.variants?.length && variants.length)
          await payload.update({ collection: 'offers', id: offer.id, data: { variants }, ...opts })
      }
      switches = usedLicenseSwitches(all)
    }
    await payload.update({
      collection: 'products',
      id: option.productId,
      data: {
        pageView: 'picker',
        picker: {
          switches,
          steps: [
            {
              title: option.step,
              mode: 'one',
              hint: null,
              collapsed: false,
              items: option.items.map((item) => ({
                product: item.productId,
                offers: [],
                label: item.label,
                note: item.note,
                preselect: item.preselect,
              })),
            },
          ],
        },
      },
      ...opts,
    })
    report.options += 1
  }
  for (const id of extras.noPage)
    await payload.update({ collection: 'products', id, data: { pageView: 'none' }, ...opts })
  for (const id of extras.drafts)
    await payload.update({ collection: 'products', id, data: { status: 'draft' }, ...opts })
  report.drafts = extras.drafts.length

  await payload.create({
    collection: 'import-runs',
    data: { idempotencyKey: FAMILIES_SETUP_V5_KEY, state: 'done', snapshot: report },
    ...opts,
  })
  return report
}
