import type { Payload } from 'payload'
import { OLD_SITE } from '../domain/bitrixImport.mjs'
import { restoreProductTables } from '../domain/productTables.mjs'
import { productPath } from './productPath'

/** Ключ записи в журнале «Запуски импорта»: настройка выполняется один раз. */
export const PRODUCT_TABLES_SETUP_KEY = 'catalog-setup:product-tables-v1'
const opts = { overrideAccess: true, depth: 0 } as const
/** Столько страниц старого сайта скачиваем одновременно. */
const PARALLEL = 6

async function fetchPage(url: string) {
  const response = await fetch(url, {
    signal: AbortSignal.timeout(15_000),
    headers: { 'user-agent': 'cad.kz-migration' },
  })
  if (response.status === 404) return null
  if (!response.ok) throw new Error(`ответ ${response.status}`)
  return response.text()
}

export type ProductTablesReport = {
  checked: number
  updated: string[]
  tables: number
  failed: number
}

/**
 * Таблицы в описаниях товаров (src/domain/productTables.mjs): страница каждого товара со
 * старого cad.kz, таблицы встают на место столбиков. Если старый сайт не ответил хотя бы для
 * одного товара — не отмечает: при следующей сборке повторит (уже исправленное не меняется).
 * null — уже сделано.
 */
export async function setupProductTables(payload: Payload): Promise<ProductTablesReport | null> {
  const done = await payload.find({
    collection: 'import-runs',
    where: { idempotencyKey: { equals: PRODUCT_TABLES_SETUP_KEY } },
    limit: 1,
    ...opts,
  })
  if (done.docs.length) return null

  const { docs } = await payload.find({
    collection: 'products',
    where: { description: { exists: true } },
    sort: 'id',
    pagination: false,
    select: { title: true, slug: true, legacyUrl: true, description: true },
    ...opts,
  })
  const items = docs
    .map((doc) => ({ doc, path: productPath(doc) }))
    .filter(({ doc, path }) => doc.description && path.startsWith('/catalog/'))
  const report: ProductTablesReport = { checked: items.length, updated: [], tables: 0, failed: 0 }
  for (let next = 0; next < items.length; next += PARALLEL) {
    // Старый сайт недоступен целиком — не ждём таймаутов по всем товарам, повторим в следующий раз.
    if (report.failed >= PARALLEL * 2 && report.failed * 2 > next) break
    await Promise.all(
      items.slice(next, next + PARALLEL).map(async ({ doc, path }) => {
        let html: string | null
        try {
          html = await fetchPage(`${OLD_SITE}${encodeURI(path)}`)
        } catch {
          report.failed++
          return
        }
        if (!html) return
        const { description, replaced } = restoreProductTables(doc.description ?? '', html)
        if (!replaced) return
        await payload.update({ collection: 'products', id: doc.id, data: { description }, ...opts })
        report.updated.push(`${doc.title}: ${replaced}`)
        report.tables += replaced
      }),
    )
  }
  if (!report.failed)
    await payload.create({
      collection: 'import-runs',
      data: {
        idempotencyKey: PRODUCT_TABLES_SETUP_KEY,
        state: 'done',
        snapshot: { report: `таблиц ${report.tables} в ${report.updated.length} товарах` },
      },
      ...opts,
    })
  return report
}
