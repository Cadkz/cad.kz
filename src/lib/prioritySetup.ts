import type { Payload } from 'payload'
import { SECTION_PINS, seedLevel, VENDOR_LEVELS } from '../domain/prioritySeed.mjs'
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
