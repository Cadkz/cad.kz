import type { Payload } from 'payload'
import { sectionIcons } from '../cms/collections/catalog'
import { NEW_SECTIONS } from '../domain/directionRules.mjs'
import { CROSS_DEFAULTS, NEW_SECTION_ICONS, seedRules } from '../domain/sectionRulesSeed.mjs'
import { relIds } from './rel'
import { type ApplyReport, applySectionRules } from './sectionRules'

/** Ключ записи в журнале «Запуски импорта»: настройка выполняется один раз. */
export const CATALOG_SETUP_KEY = 'catalog-setup:directions-v1'
const SKIP_APPLY = { skipSectionRulesApply: true }
const opts = { overrideAccess: true, depth: 0 } as const

type SetupReport = {
  createdSections: string[]
  rules: number
  skippedRules: string[]
  crossSections: number
  askon: number
  apply: ApplyReport
}

/** Разделы по slug; недостающие из NEW_SECTIONS создаются. */
async function ensureSections(payload: Payload, report: SetupReport) {
  const { docs } = await payload.find({
    collection: 'sections',
    limit: 500,
    pagination: false,
    ...opts,
  })
  const bySlug = new Map(docs.map((doc) => [doc.slug, doc]))
  for (const [slug, section] of Object.entries(NEW_SECTIONS)) {
    if (bySlug.has(slug)) continue
    const wanted: string = NEW_SECTION_ICONS[slug as keyof typeof NEW_SECTION_ICONS]
    const icon = sectionIcons.find((item) => item === wanted) ?? 'file'
    const doc = await payload.create({
      collection: 'sections',
      data: {
        title: section.title,
        slug,
        status: 'published',
        isDirection: false,
        menuGroup: section.menuGroup as 'hardware' | 'service',
        icon,
        legacyKey: `catalog:sections:${slug}`,
      },
      ...opts,
    })
    bySlug.set(slug, doc)
    report.createdSections.push(section.title)
  }
  return bySlug
}

/** Правила из утверждённых групп; правило с неизвестным производителем или разделом пропускается. */
async function seedSectionRules(
  payload: Payload,
  sections: Map<string, { id: number }>,
  report: SetupReport,
) {
  const { docs } = await payload.find({
    collection: 'manufacturers',
    limit: 500,
    pagination: false,
    ...opts,
  })
  const vendors = new Map(docs.map((doc) => [doc.title.toLowerCase(), doc.id]))
  for (const rule of seedRules()) {
    const manufacturer = rule.vendor ? vendors.get(rule.vendor.toLowerCase()) : null
    const slugs = [rule.main, ...rule.extra].filter((slug): slug is string => Boolean(slug))
    const missing = slugs.filter((slug) => !sections.has(slug))
    if ((rule.vendor && !manufacturer) || missing.length) {
      report.skippedRules.push(
        `${rule.title}: ${rule.vendor && !manufacturer ? `нет производителя ${rule.vendor}` : `нет разделов ${missing.join(', ')}`}`,
      )
      continue
    }
    await payload.create({
      collection: 'section-rules',
      data: {
        title: rule.title,
        order: rule.order,
        manufacturer: manufacturer ?? null,
        kind: (rule.kind as 'software' | 'hardware' | 'course' | 'service' | null) ?? null,
        words: rule.words,
        mainSection: rule.main ? sections.get(rule.main)?.id : null,
        extraSections: rule.extra.map((slug) => sections.get(slug)?.id ?? 0).filter(Boolean),
        retire: rule.retire,
      },
      context: SKIP_APPLY,
      ...opts,
    })
    report.rules++
  }
}

/** «С этим покупают» у разделов, если ни у одного раздела это ещё не настроено. */
async function seedCrossSections(
  payload: Payload,
  sections: Map<string, { id: number; crossSections?: unknown }>,
  report: SetupReport,
) {
  const configured = [...sections.values()].some(
    (section) => relIds(section.crossSections as number[] | undefined).length > 0,
  )
  if (configured) return
  for (const [slug, targets] of Object.entries(CROSS_DEFAULTS)) {
    const section = sections.get(slug)
    const ids = targets.map((target) => sections.get(target)?.id).filter((id): id is number => !!id)
    if (!section || !ids.length) continue
    await payload.update({
      collection: 'sections',
      id: section.id,
      data: { crossSections: ids },
      ...opts,
    })
    report.crossSections++
  }
}

/** Справочники АСКОН в Битриксе отмечены как «Курс», по сути это программы. */
async function fixAskon(payload: Payload, report: SetupReport) {
  const vendor = await payload.find({
    collection: 'manufacturers',
    where: { title: { equals: 'АСКОН' } },
    limit: 1,
    ...opts,
  })
  const id = vendor.docs[0]?.id
  if (!id) return
  const { docs } = await payload.find({
    collection: 'products',
    where: { and: [{ manufacturer: { equals: id } }, { kind: { equals: 'course' } }] },
    limit: 100,
    ...opts,
  })
  for (const product of docs) {
    await payload.update({
      collection: 'products',
      id: product.id,
      data: { kind: 'software' },
      ...opts,
    })
    report.askon++
  }
}

/**
 * Настройка разделов каталога по утверждённым направлениям (09.10.2026). Выполняется один раз:
 * отметка — запись в журнале «Запуски импорта». Повторный запуск ничего не делает.
 */
export async function setupCatalogSections(payload: Payload): Promise<SetupReport | null> {
  const done = await payload.find({
    collection: 'import-runs',
    where: { idempotencyKey: { equals: CATALOG_SETUP_KEY } },
    limit: 1,
    ...opts,
  })
  if (done.docs.length) return null
  const report: SetupReport = {
    createdSections: [],
    rules: 0,
    skippedRules: [],
    crossSections: 0,
    askon: 0,
    apply: { checked: 0, changed: 0, hidden: 0, noRule: 0, manual: 0 },
  }
  const sections = await ensureSections(payload, report)
  const existingRules = await payload.count({ collection: 'section-rules', overrideAccess: true })
  if (existingRules.totalDocs === 0) await seedSectionRules(payload, sections, report)
  await seedCrossSections(payload, sections, report)
  await fixAskon(payload, report)
  report.apply = await applySectionRules(payload)
  await payload.create({
    collection: 'import-runs',
    data: { idempotencyKey: CATALOG_SETUP_KEY, state: 'done', snapshot: report },
    ...opts,
  })
  return report
}
