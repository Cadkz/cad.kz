import type { Payload } from 'payload'
import { normalize } from '../domain/search.mjs'
import { mergeAliases, SEARCH_ALIASES, SEARCH_ALIASES_V2 } from '../domain/searchSeed.mjs'

/** Ключ записи в журнале «Запуски импорта»: настройка выполняется один раз. */
export const SEARCH_SETUP_KEY = 'catalog-setup:search-v1'
export const SEARCH_SETUP_V2_KEY = 'catalog-setup:search-v2'
const opts = { overrideAccess: true, depth: 0 } as const

/**
 * Волны «Других названий для поиска». Первая заполняет только пустые поля, вторая дописывает
 * недостающие слова к тому, что уже есть (вписанное в админке не теряется).
 */
const WAVES = [
  { key: SEARCH_SETUP_KEY, seeds: SEARCH_ALIASES, append: false },
  { key: SEARCH_SETUP_V2_KEY, seeds: SEARCH_ALIASES_V2, append: true },
]

/** «Другие названия для поиска» у ходовых товаров (акад → AutoCAD). null — всё уже сделано. */
export async function setupSearchAliases(payload: Payload): Promise<string[] | null> {
  const done = await payload.find({
    collection: 'import-runs',
    where: { idempotencyKey: { in: WAVES.map((wave) => wave.key) } },
    pagination: false,
    select: { idempotencyKey: true },
    ...opts,
  })
  const doneKeys = new Set(done.docs.map((doc) => doc.idempotencyKey))
  const waves = WAVES.filter((wave) => !doneKeys.has(wave.key))
  if (!waves.length) return null
  const { docs } = await payload.find({
    collection: 'products',
    pagination: false,
    select: { title: true, searchAliases: true },
    ...opts,
  })
  const report: string[] = []
  for (const wave of waves) {
    const waveReport: string[] = []
    for (const seed of wave.seeds) {
      const product = docs.find((doc) => normalize(doc.title) === normalize(seed.title))
      if (!product || (!wave.append && product.searchAliases)) continue
      const aliases = wave.append ? mergeAliases(product.searchAliases, seed.aliases) : seed.aliases
      if (aliases === product.searchAliases) continue
      await payload.update({
        collection: 'products',
        id: product.id,
        data: { searchAliases: aliases },
        ...opts,
      })
      product.searchAliases = aliases
      waveReport.push(`${product.title}: ${aliases}`)
    }
    await payload.create({
      collection: 'import-runs',
      data: { idempotencyKey: wave.key, state: 'done', snapshot: { report: waveReport } },
      ...opts,
    })
    report.push(...waveReport)
  }
  return report
}
