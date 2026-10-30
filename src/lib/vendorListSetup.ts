import type { Payload } from 'payload'
import seed from '../domain/autodeskVendorList.json' with { type: 'json' }
import { VENDOR_STATE, validateVendorList } from '../domain/vendorList.mjs'

/**
 * Прайс-лист Autodesk для Кадди (просьба владельца 29.10.2026), разово при сборке: что Autodesk
 * сейчас продаёт, даже чего нет на сайте. Файл владельца разобран заранее, в репозитории только
 * названия и способы покупки, без цен (`src/domain/autodeskVendorList.json`). Если прайс-лист уже
 * загружен в админке («Прайс и база Кадди»), не трогаем. Следующие месяцы — загрузкой там же.
 */
export const VENDOR_LIST_KEY = 'catalog-setup:autodesk-vendor-list-2026-10'
const opts = { overrideAccess: true, depth: 0 } as const

export async function setupVendorList(payload: Payload): Promise<string[] | null> {
  const done = await payload.find({
    collection: 'import-runs',
    where: { idempotencyKey: { equals: VENDOR_LIST_KEY } },
    limit: 1,
    ...opts,
  })
  if (done.docs.length) return null
  const report: string[] = []
  const existing = await payload.count({
    collection: 'price-tables',
    where: { state: { equals: VENDOR_STATE } },
    overrideAccess: true,
  })
  const list = validateVendorList(seed.list)
  if (typeof list === 'string') report.push(`файл прайс-листа не прошёл проверку: ${list}`)
  else if (existing.totalDocs) report.push('прайс-лист уже загружен в админке — не трогали')
  else {
    await payload.create({
      collection: 'price-tables',
      data: {
        state: VENDOR_STATE,
        summary: {
          vendor: list.vendor,
          from: list.from,
          to: list.to,
          products: list.products.length,
          fileName: seed.fileName,
          uploadedAt: new Date().toISOString(),
        },
        snapshot: { version: 1, list },
      },
      ...opts,
    })
    report.push(`${list.vendor}: ${list.products.length} продуктов, ${list.from} — ${list.to}`)
  }
  await payload.create({
    collection: 'import-runs',
    data: { idempotencyKey: VENDOR_LIST_KEY, state: 'done', snapshot: { report } },
    ...opts,
  })
  return report
}
