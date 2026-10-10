import type { Payload } from 'payload'
import { normalize } from '../domain/search.mjs'
import { SEARCH_ALIASES } from '../domain/searchSeed.mjs'

/** Ключ записи в журнале «Запуски импорта»: настройка выполняется один раз. */
export const SEARCH_SETUP_KEY = 'catalog-setup:search-v1'
const opts = { overrideAccess: true, depth: 0 } as const

/** «Другие названия для поиска» у ходовых товаров (акад → AutoCAD). Пустые поля, один раз. */
export async function setupSearchAliases(payload: Payload): Promise<string[] | null> {
  const done = await payload.find({
    collection: 'import-runs',
    where: { idempotencyKey: { equals: SEARCH_SETUP_KEY } },
    limit: 1,
    ...opts,
  })
  if (done.docs.length) return null
  const { docs } = await payload.find({
    collection: 'products',
    pagination: false,
    select: { title: true, searchAliases: true },
    ...opts,
  })
  const report: string[] = []
  for (const seed of SEARCH_ALIASES) {
    const product = docs.find((doc) => normalize(doc.title) === normalize(seed.title))
    if (!product || product.searchAliases) continue
    await payload.update({
      collection: 'products',
      id: product.id,
      data: { searchAliases: seed.aliases },
      ...opts,
    })
    report.push(`${product.title}: ${seed.aliases}`)
  }
  await payload.create({
    collection: 'import-runs',
    data: { idempotencyKey: SEARCH_SETUP_KEY, state: 'done', snapshot: { report } },
    ...opts,
  })
  return report
}
