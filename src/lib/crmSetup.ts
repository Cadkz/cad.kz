import type { Payload } from 'payload'
import type { Section } from '../../payload-types'
import {
  CRM_CROSS,
  CRM_DEMO_SECTIONS,
  CRM_NEW_SECTIONS,
  CRM_ORDER,
  CRM_PARENTS,
  CRM_PINS,
  CRM_RENAMES,
  CRM_RULES,
  CRM_SECTION_SCENARIOS,
  CRM_SUMMARIES,
  CRM_VENDOR_LEVELS,
  planRuleOrder,
  seedProductLevel,
  seedScenario,
} from '../domain/crmCatalogSeed.mjs'
import { setupCrmHome } from './crmHome'
import { relId, relIds } from './rel'
import { applySectionRules } from './sectionRules'

/** Ключ записи в журнале «Запуски импорта»: настройка выполняется один раз. */
export const CRM_SETUP_KEY = 'catalog-setup:crm-v1'
const opts = { overrideAccess: true, depth: 0 } as const
const SKIP_APPLY = { skipSectionRulesApply: true }

type Vendors = Map<string, number>

/** Новые разделы, названия, подразделы, порядок, сценарии, демонстрация, производители первыми. */
async function setupSections(payload: Payload, vendors: Vendors, report: string[]) {
  const { docs } = await payload.find({ collection: 'sections', pagination: false, ...opts })
  const bySlug = new Map<string, Section>(docs.map((doc) => [doc.slug, doc]))
  for (const section of CRM_NEW_SECTIONS) {
    if (bySlug.has(section.slug)) continue
    const created = await payload.create({
      collection: 'sections',
      data: {
        title: section.title,
        slug: section.slug,
        status: 'published',
        isDirection: section.isDirection,
        menuGroup: section.menuGroup === 'hardware' ? 'hardware' : 'software',
        icon: section.icon === 'compass' ? 'compass' : 'printer',
        tone: 'navy',
        summary: section.summary,
        legacyKey: `catalog:sections:${section.slug}`,
      },
      ...opts,
    })
    bySlug.set(section.slug, created)
    report.push(`Новый раздел: ${section.title}`)
  }
  const idOf = (slug: string) => bySlug.get(slug)?.id
  for (const [slug, section] of bySlug) {
    const data: Partial<Section> = {}
    const rename = CRM_RENAMES[slug]
    if (rename && section.title === rename[0]) data.title = rename[1]
    const summary = CRM_SUMMARIES[slug]
    if (summary && (section.summary ?? '') === summary[0]) data.summary = summary[1]
    const parent = CRM_PARENTS[slug as keyof typeof CRM_PARENTS]
    if (parent && idOf(parent) && relId(section.parent) == null) data.parent = idOf(parent)
    if (CRM_ORDER[slug] != null) data.order = CRM_ORDER[slug]
    if (CRM_SECTION_SCENARIOS[slug] && !section.scenario)
      data.scenario = CRM_SECTION_SCENARIOS[slug]
    if (CRM_DEMO_SECTIONS.includes(slug)) data.demoButton = true
    const pins = CRM_PINS[slug]
    if (pins) data.pinnedManufacturers = pins.flatMap((name) => vendors.get(name) ?? [])
    const cross = CRM_CROSS[slug]
    if (cross && !relIds(section.crossSections).length)
      data.crossSections = cross.flatMap((target) => idOf(target) ?? [])
    if (!Object.keys(data).length) continue
    await payload.update({ collection: 'sections', id: section.id, data, ...opts })
    if (data.title) report.push(`Раздел переименован: ${section.title} → ${data.title}`)
    if (data.parent) report.push(`Подраздел «${section.title}» — в «${bySlug.get(parent)?.title}»`)
  }
  return idOf
}

/** Новые правила разделов сразу за «Снят с продажи»; прежние сдвигаются, если нет места. */
async function setupRules(
  payload: Payload,
  vendors: Vendors,
  idOf: (slug: string) => number | undefined,
  report: string[],
) {
  const { docs } = await payload.find({ collection: 'section-rules', pagination: false, ...opts })
  const titles = new Set(docs.map((doc) => doc.title))
  const fresh = CRM_RULES.filter((rule) => !titles.has(rule.title))
  if (!fresh.length) return
  const plan = planRuleOrder(
    docs.map((doc) => ({ id: doc.id, order: doc.order ?? 100, retire: Boolean(doc.retire) })),
    fresh.length,
  )
  if (plan.shift)
    for (const doc of docs)
      if ((doc.order ?? 100) > plan.after)
        await payload.update({
          collection: 'section-rules',
          id: doc.id,
          data: { order: (doc.order ?? 100) + plan.shift },
          context: SKIP_APPLY,
          ...opts,
        })
  let created = 0
  for (const [index, rule] of fresh.entries()) {
    const manufacturer = rule.vendor ? vendors.get(rule.vendor) : null
    const main = idOf(rule.main)
    if ((rule.vendor && !manufacturer) || !main) {
      report.push(`Правило пропущено (нет производителя или раздела): ${rule.title}`)
      continue
    }
    await payload.create({
      collection: 'section-rules',
      data: {
        title: rule.title,
        order: plan.starts[index],
        manufacturer: manufacturer ?? null,
        kind: rule.kind === 'software' ? 'software' : null,
        words: rule.words,
        mainSection: main,
        extraSections: rule.extra.flatMap((slug) => idOf(slug) ?? []),
        retire: false,
      },
      context: SKIP_APPLY,
      ...opts,
    })
    created++
  }
  report.push(`Правил разделов добавлено: ${created}`)
}

/** Сценарий и уровень показа товарам, где их не выбирали; уровень производителям. */
async function setupProducts(payload: Payload, vendors: Vendors, report: string[]) {
  const titleOf = new Map([...vendors].map(([title, id]) => [id, title]))
  for (const [title, level] of Object.entries(CRM_VENDOR_LEVELS)) {
    const id = vendors.get(title)
    if (!id) continue
    const vendor = await payload.findByID({ collection: 'manufacturers', id, ...opts })
    if ((vendor.priority ?? 'normal') !== 'normal') continue
    await payload.update({ collection: 'manufacturers', id, data: { priority: level }, ...opts })
    report.push(`Топ производителя: ${title}`)
  }
  const { docs } = await payload.find({
    collection: 'products',
    pagination: false,
    select: { title: true, manufacturer: true, scenario: true, priority: true },
    ...opts,
  })
  const counts = { scenario: 0, priority: 0 }
  for (const product of docs) {
    const vendorId = relId(product.manufacturer)
    const item = {
      title: product.title,
      vendor: vendorId == null ? null : (titleOf.get(vendorId) ?? null),
    }
    const scenario = product.scenario ? null : seedScenario(item)
    const priority = product.priority ? null : seedProductLevel(item)
    if (!scenario && !priority) continue
    await payload.update({
      collection: 'products',
      id: product.id,
      data: { ...(scenario ? { scenario } : {}), ...(priority ? { priority } : {}) },
      ...opts,
    })
    if (scenario) counts.scenario++
    if (priority) counts.priority++
  }
  report.push(`Сценарий покупки у товаров: ${counts.scenario}; уровень показа: ${counts.priority}`)
}

/**
 * Каталог по CRM (P0 документа, 12.10.2026). Один раз при сборке: отметка в «Запусках импорта».
 * null — уже сделано.
 */
export async function setupCrmCatalog(payload: Payload): Promise<string[] | null> {
  const done = await payload.find({
    collection: 'import-runs',
    where: { idempotencyKey: { equals: CRM_SETUP_KEY } },
    limit: 1,
    ...opts,
  })
  if (done.docs.length) return null
  const report: string[] = []
  const makers = await payload.find({ collection: 'manufacturers', pagination: false, ...opts })
  const vendors: Vendors = new Map(makers.docs.map((doc) => [doc.title, doc.id]))
  const idOf = await setupSections(payload, vendors, report)
  await setupRules(payload, vendors, idOf, report)
  const applied = await applySectionRules(payload)
  report.push(
    `Разделы товаров пересчитаны: проверено ${applied.checked}, изменено ${applied.changed}, с ручными разделами ${applied.manual}`,
  )
  await setupProducts(payload, vendors, report)
  report.push(...(await setupCrmHome(payload)))
  await payload.create({
    collection: 'import-runs',
    data: { idempotencyKey: CRM_SETUP_KEY, state: 'done', snapshot: { report } },
    ...opts,
  })
  return report
}
