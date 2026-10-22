import type { Payload } from 'payload'
import type { Product, Section } from '../../payload-types'
import { SKIP_APPLY_CONTEXT } from '../cms/collections/sectionRules'
import {
  ADDON_ONLY,
  EQUIPMENT_RULES,
  EQUIPMENT_SECTIONS,
  flagshipOrder,
  RECAP_RULE_WORDS,
  SCAN_SOFTWARE,
  SCAN_SOFTWARE_SECTION,
  VENDOR_RENAME,
} from '../domain/equipmentSeed.mjs'
import { relId, relIds } from './rel'

/** Ключ записи в журнале «Запуски импорта»: настройка выполняется один раз. */
export const EQUIPMENT_KEY = 'catalog-setup:equipment-v1'
const opts = { overrideAccess: true, depth: 0 } as const
const skip = { [SKIP_APPLY_CONTEXT]: true }

type Ctx = { payload: Payload; report: string[]; sections: Section[]; products: Product[] }

const low = (value: string | null | undefined) => String(value ?? '').toLowerCase()

/** Разделы товара явно: иначе смена названия или типа пересчитала бы их по правилам. */
const keepSections = (product: Product) => ({
  mainSection: relId(product.mainSection),
  extraSections: relIds(product.extraSections),
})

/** Image Access → WideTEK: та же запись, все товары и связи остаются. */
async function renameVendor(ctx: Ctx) {
  const { docs } = await ctx.payload.find({
    collection: 'manufacturers',
    where: { title: { equals: VENDOR_RENAME.from } },
    limit: 1,
    ...opts,
  })
  const vendor = docs[0]
  if (!vendor) return ctx.report.push(`Производитель «${VENDOR_RENAME.from}» не найден — пропущено`)
  await ctx.payload.update({
    collection: 'manufacturers',
    id: vendor.id,
    data: { title: VENDOR_RENAME.to },
    ...opts,
  })
  ctx.report.push(`Производитель «${VENDOR_RENAME.from}» переименован в «${VENDOR_RENAME.to}»`)
}

type SectionSeed = (typeof EQUIPMENT_SECTIONS)[number]

/** Что записать в раздел: название, место, описание, производители первыми. */
function sectionData(
  seed: SectionSeed,
  section: Section,
  parent: Section | null | undefined,
  vendorId: (title: string) => number | undefined,
) {
  const pins = (seed.pins ?? []).flatMap((title) => vendorId(title) ?? [])
  return {
    title: seed.title,
    parent: parent?.id ?? null,
    order: seed.order,
    summary: seed.summary,
    menuGroup: 'hardware' as const,
    // Бывший подраздел становится типом: сценарий раньше брался у родителя.
    ...(seed.parent ? {} : { scenario: section.scenario ?? ('equipment' as const) }),
    ...(seed.icon ? { icon: seed.icon } : {}),
    ...(pins.length ? { pinnedManufacturers: pins } : {}),
  }
}

/** Четыре типа оборудования, плоттеры и комплектующие — подразделами «Широкоформатных плоттеров». */
async function sections(ctx: Ctx) {
  const { payload, report } = ctx
  const vendors = await payload.find({ collection: 'manufacturers', pagination: false, ...opts })
  const vendorId = (title: string) => vendors.docs.find((v) => v.title === title)?.id
  const bySlug = (slug: string) => ctx.sections.find((section) => section.slug === slug)
  const done: string[] = []
  for (const seed of EQUIPMENT_SECTIONS) {
    const section = bySlug(seed.slug)
    if (!section) {
      report.push(`Раздел ${seed.slug} не найден — пропущено`)
      continue
    }
    const parent = seed.parent ? bySlug(seed.parent) : null
    await payload.update({
      collection: 'sections',
      id: section.id,
      data: sectionData(seed, section, parent, vendorId),
      ...opts,
    })
    const parentTitle = EQUIPMENT_SECTIONS.find((item) => item.slug === seed.parent)?.title
    done.push(parentTitle ? `${parentTitle} → ${seed.title}` : seed.title)
  }
  report.push(`Разделы оборудования: ${done.join('; ')}`)
}

/** Программы для сканов — в «Машиностроение» как ПО; метрологический набор — только доп. */
async function scanSoftware(ctx: Ctx) {
  const { payload, report } = ctx
  const machine = ctx.sections.find((s) => s.slug === SCAN_SOFTWARE_SECTION)
  const scanners = ctx.sections.find((s) => s.slug === 'scanners')
  if (!machine) return report.push('Раздел «Машиностроение» не найден — программы не перенесены')
  const moved: string[] = []
  for (const seed of SCAN_SOFTWARE) {
    const product = ctx.products.find((p) => p.slug === seed.slug)
    if (!product) {
      report.push(`Не найдено ${seed.slug}`)
      continue
    }
    const own = relIds(product.extraSections).filter(
      (id) => id !== scanners?.id && id !== machine.id,
    )
    await payload.update({
      collection: 'products',
      id: product.id,
      data: {
        kind: seed.kind,
        mainSection: machine.id,
        extraSections: seed.extra === null ? own : [],
      },
      ...opts,
    })
    moved.push(product.title)
  }
  report.push(`В «Машиностроение» как программы: ${moved.join('; ') || '—'}`)

  const hidden: string[] = []
  for (const seed of ADDON_ONLY) {
    const product = ctx.products.find((p) => p.slug === seed.slug)
    const target = ctx.products.find((p) => p.slug === seed.redirect)
    if (!product) continue
    await payload.update({
      collection: 'products',
      id: product.id,
      data: { pageView: 'none', redirectTo: target?.id ?? null, ...keepSections(product) },
      ...opts,
    })
    hidden.push(product.title)
  }
  report.push(`Только допом в подборе сканеров: ${hidden.join('; ') || '—'}`)
}

/** Флагманы Canon и WideTEK первыми: «Порядок в линейке». */
async function flagships(ctx: Ctx) {
  const set: string[] = []
  for (const product of ctx.products) {
    const order = flagshipOrder(product.slug)
    if (order == null || product.lineOrder === order) continue
    await ctx.payload.update({
      collection: 'products',
      id: product.id,
      data: { lineOrder: order, ...keepSections(product) },
      ...opts,
    })
    set.push(`${product.title} — ${order}`)
  }
  ctx.report.push(`Порядок флагманов: ${set.join('; ') || 'уже стоит'}`)
}

/** Правила разделов, чтобы новые версии Artec Studio и ReCap из импорта попадали куда надо. */
async function rules(ctx: Ctx) {
  const { payload, report } = ctx
  const [found, vendors] = await Promise.all([
    payload.find({ collection: 'section-rules', pagination: false, ...opts }),
    payload.find({ collection: 'manufacturers', pagination: false, ...opts }),
  ])
  const section = (slug: string) => ctx.sections.find((s) => s.slug === slug)?.id ?? null
  const orders = new Set(found.docs.map((rule) => rule.order))
  for (const seed of EQUIPMENT_RULES) {
    if (found.docs.some((rule) => rule.title === seed.title)) continue
    const vendor = vendors.docs.find((v) => v.title === seed.vendor)?.id
    const general = found.docs.find(
      (rule) => relId(rule.manufacturer) === vendor && !low(rule.words).trim(),
    )
    const order = [5, 3, 1]
      .map((d) => (general?.order ?? 1000) - d)
      .find((o) => o > 0 && !orders.has(o))
    if (vendor == null || order == null) {
      report.push(`Правило «${seed.title}»: не добавлено, добавить вручную`)
      continue
    }
    await payload.create({
      collection: 'section-rules',
      data: {
        title: seed.title,
        order,
        manufacturer: vendor,
        words: seed.words,
        mainSection: section(seed.main),
        extraSections: seed.extra.flatMap((slug) => section(slug) ?? []),
      },
      context: skip,
      ...opts,
    })
    orders.add(order)
    report.push(`Новое правило «${seed.title}»`)
  }
  const recap = found.docs.find((rule) => low(rule.words).trim() === RECAP_RULE_WORDS)
  const machine = section(SCAN_SOFTWARE_SECTION)
  if (recap && machine != null && relId(recap.mainSection) !== machine) {
    await payload.update({
      collection: 'section-rules',
      id: recap.id,
      data: {
        title: 'ReCap Pro — Машиностроение',
        mainSection: machine,
        extraSections: relIds(recap.extraSections).filter((id) => id !== section('scanners')),
      },
      context: skip,
      ...opts,
    })
    report.push('Правило ReCap: «3D-сканирование» → «Машиностроение»')
  }
}

/**
 * Оборудование как в Битриксе (22.10.2026, пункты 1–4). Один раз (отметка в журнале).
 * Товары меняются с явными разделами, поэтому пересчёт по правилам их не трогает.
 * null — уже сделано.
 */
export async function setupEquipment(payload: Payload): Promise<string[] | null> {
  const done = await payload.find({
    collection: 'import-runs',
    where: { idempotencyKey: { equals: EQUIPMENT_KEY } },
    limit: 1,
    ...opts,
  })
  if (done.docs.length) return null

  const ctx: Ctx = { payload, report: [], sections: [], products: [] }
  await renameVendor(ctx)
  ctx.sections = (await payload.find({ collection: 'sections', pagination: false, ...opts })).docs
  ctx.products = (await payload.find({ collection: 'products', pagination: false, ...opts })).docs
  await sections(ctx)
  await scanSoftware(ctx)
  await flagships(ctx)
  await rules(ctx)

  await payload.create({
    collection: 'import-runs',
    data: { idempotencyKey: EQUIPMENT_KEY, state: 'done', snapshot: { report: ctx.report } },
    ...opts,
  })
  return ctx.report
}
