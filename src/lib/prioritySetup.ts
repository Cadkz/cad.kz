import type { Payload } from 'payload'
import {
  SECTION_PINS,
  scadBeforeLira,
  seedLevel,
  seedTopPlace,
  TOP_SALES,
  VENDOR_LEVELS,
} from '../domain/prioritySeed.mjs'
import { relId } from './rel'

/** Ключ записи в журнале «Запуски импорта»: настройка выполняется один раз. */
export const PRIORITY_SETUP_KEY = 'catalog-setup:priority-v1'
const opts = { overrideAccess: true, depth: 0 } as const

type PriorityReport = { vendors: string[]; products: number; sections: string[] }
type Level = 'flagship' | 'top' | 'normal' | 'low'

/**
 * Первая настройка приоритета показа: топы продаж у производителей и товаров, порядок
 * производителей в разделах. Только в пустые поля, один раз (отметка в журнале). Повторный запуск
 * ничего не делает, дальше всё правится в админке.
 */
export async function setupPriorities(payload: Payload): Promise<PriorityReport | null> {
  const done = await payload.find({
    collection: 'import-runs',
    where: { idempotencyKey: { equals: PRIORITY_SETUP_KEY } },
    limit: 1,
    ...opts,
  })
  if (done.docs.length) return null
  const report: PriorityReport = { vendors: [], products: 0, sections: [] }

  const vendors = await payload.find({
    collection: 'manufacturers',
    pagination: false,
    ...opts,
  })
  const vendorByTitle = new Map(vendors.docs.map((m) => [m.title, m.id]))
  const titleById = new Map(vendors.docs.map((m) => [m.id, m.title]))
  for (const [title, level] of Object.entries(VENDOR_LEVELS)) {
    const id = vendorByTitle.get(title)
    if (!id) continue
    await payload.update({
      collection: 'manufacturers',
      id,
      data: { priority: level as Level },
      ...opts,
    })
    report.vendors.push(title)
  }

  const products = await payload.find({
    collection: 'products',
    pagination: false,
    ...opts,
    select: { title: true, manufacturer: true, priority: true },
  })
  for (const product of products.docs) {
    if (product.priority) continue
    const level = seedLevel({
      title: product.title,
      vendor: titleById.get(relId(product.manufacturer) ?? -1) ?? null,
    })
    if (!level) continue
    // Разделы товара не трогаем: в данных только приоритет, хук разделов его пропускает.
    await payload.update({
      collection: 'products',
      id: product.id,
      data: { priority: level },
      ...opts,
    })
    report.products++
  }

  const sections = await payload.find({ collection: 'sections', pagination: false, ...opts })
  for (const section of sections.docs) {
    const titles = SECTION_PINS[section.slug as keyof typeof SECTION_PINS]
    if (!titles || (section.pinnedManufacturers ?? []).length) continue
    const ids = titles.map((title) => vendorByTitle.get(title)).filter((id): id is number => !!id)
    if (!ids.length) continue
    await payload.update({
      collection: 'sections',
      id: section.id,
      data: { pinnedManufacturers: ids },
      ...opts,
    })
    report.sections.push(section.title)
  }

  await payload.create({
    collection: 'import-runs',
    data: { idempotencyKey: PRIORITY_SETUP_KEY, state: 'done', snapshot: report },
    ...opts,
  })
  return report
}

/** Места топов продаж: дозаполнение после исправленного правила СПДС (в v2 оно не сработало). */
export const PRIORITY_V3_KEY = 'catalog-setup:priority-v3'

/** Ставит «Место в топе продаж» по TOP_SALES товарам с пустым местом; строки «место. название». */
async function placeTopSales(payload: Payload): Promise<string[]> {
  const vendors = await payload.find({ collection: 'manufacturers', pagination: false, ...opts })
  const titleById = new Map(vendors.docs.map((m) => [m.id, m.title]))
  const products = await payload.find({
    collection: 'products',
    pagination: false,
    ...opts,
    select: { title: true, manufacturer: true, topOrder: true },
  })
  const placed: string[] = []
  for (const product of products.docs) {
    if (product.topOrder != null) continue
    const place = seedTopPlace({
      title: product.title,
      vendor: titleById.get(relId(product.manufacturer) ?? -1) ?? null,
    })
    if (place == null) continue
    await payload.update({
      collection: 'products',
      id: product.id,
      data: { topOrder: place },
      ...opts,
    })
    placed.push(`${place}. ${product.title}`)
  }
  return placed.sort((a, b) => Number.parseInt(a, 10) - Number.parseInt(b, 10))
}

/**
 * Третья настройка (21.10.2026): дозаполняет места, которые не поставила вторая (СПДС — правило
 * с \b не срабатывало на русских буквах). Только пустые места. null — уже сделано.
 */
export async function setupPrioritiesV3(payload: Payload): Promise<string[] | null> {
  const done = await payload.find({
    collection: 'import-runs',
    where: { idempotencyKey: { equals: PRIORITY_V3_KEY } },
    limit: 1,
    ...opts,
  })
  if (done.docs.length) return null
  const placed = await placeTopSales(payload)
  const report = [`Топы продаж, дозаполнено: ${placed.join('; ') || '—'}`]
  await payload.create({
    collection: 'import-runs',
    data: { idempotencyKey: PRIORITY_V3_KEY, state: 'done', snapshot: { report } },
    ...opts,
  })
  return report
}

/** Вторая настройка: топы продаж по местам и SCAD перед ЛИРОЙ в разделах (21.10.2026). */
export const PRIORITY_V2_KEY = 'catalog-setup:priority-v2'

/**
 * Решение владельца 21.10.2026: во всём каталоге первыми AutoCAD, АВС, Revit, SCAD Office, GEO5,
 * Artec, CSoft и только потом ЛИРА. Ставит «Место в топе продаж» товарам, у которых оно пустое
 * (src/domain/prioritySeed.mjs, TOP_SALES), и в порядке производителей разделов ставит SCAD Soft
 * перед ЛИРА-FEM. Один раз; дальше всё правится в админке. null — уже сделано.
 */
export async function setupPrioritiesV2(payload: Payload): Promise<string[] | null> {
  const done = await payload.find({
    collection: 'import-runs',
    where: { idempotencyKey: { equals: PRIORITY_V2_KEY } },
    limit: 1,
    ...opts,
  })
  if (done.docs.length) return null
  const report: string[] = []

  const vendors = await payload.find({ collection: 'manufacturers', pagination: false, ...opts })
  const vendorId = (title: string) => vendors.docs.find((m) => m.title === title)?.id

  const placed = await placeTopSales(payload)
  report.push(`Топы продаж: ${placed.join('; ') || '—'}`)
  const missing = TOP_SALES.filter(
    (rule) => !placed.some((line) => line.startsWith(`${rule.place}.`)),
  )
  for (const rule of missing) report.push(`  не найдено место ${rule.place} — ${rule.title.source}`)

  const scad = vendorId('SCAD Soft')
  const lira = vendorId('ЛИРА-FEM')
  const sections = await payload.find({ collection: 'sections', pagination: false, ...opts })
  const moved: string[] = []
  for (const section of sections.docs) {
    if (scad == null || lira == null) break
    const pins = (section.pinnedManufacturers ?? []).map((m) => relId(m) ?? 0).filter(Boolean)
    const next = scadBeforeLira(pins, scad, lira)
    if (next.join() === pins.join()) continue
    await payload.update({
      collection: 'sections',
      id: section.id,
      data: { pinnedManufacturers: next },
      ...opts,
    })
    moved.push(section.title)
  }
  report.push(`SCAD перед ЛИРОЙ в разделах: ${moved.join(', ') || '—'}`)

  await payload.create({
    collection: 'import-runs',
    data: { idempotencyKey: PRIORITY_V2_KEY, state: 'done', snapshot: { report } },
    ...opts,
  })
  return report
}
