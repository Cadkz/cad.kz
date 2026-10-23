import type { Payload } from 'payload'
import texts from '../domain/artecTexts.json' with { type: 'json' }

// Тексты сканеров Artec от владельца (24.10.2026, artec_descriptions.csv и
// artec_specifications.csv): краткое описание, обзор и характеристики по группам, значения
// переведены на русский при переносе в src/domain/artecTexts.json. Фильтры каталога не трогаем —
// они уже настроены (equipmentFiltersSetup). Artec Neo пропущен: такого товара на сайте нет.

export const ARTEC_TEXTS_KEY = 'catalog-setup:artec-texts-v1'
const opts = { overrideAccess: true, depth: 0 } as const

export async function setupArtecTexts(payload: Payload): Promise<string[] | null> {
  const done = await payload.find({
    collection: 'import-runs',
    where: { idempotencyKey: { equals: ARTEC_TEXTS_KEY } },
    limit: 1,
    ...opts,
  })
  if (done.docs.length) return null
  const report: string[] = []
  let missing = 0
  for (const seed of texts) {
    const { docs } = await payload.find({
      collection: 'products',
      where: { slug: { equals: seed.slug } },
      limit: 1,
      ...opts,
    })
    const product = docs[0]
    if (!product) {
      missing++
      report.push(`Не найден товар: ${seed.slug}`)
      continue
    }
    await payload.update({
      collection: 'products',
      id: product.id,
      data: {
        summary: seed.summary,
        description: seed.overview,
        properties: [
          // Артикул нужен интеграциям, остальные характеристики заменяем новыми.
          ...(product.properties ?? [])
            .filter((entry) => entry.name.trim().toLowerCase() === 'артикул')
            .map(({ name, value }) => ({ name, value })),
          ...seed.specs.map((spec) => ({
            name: `${spec.group} — ${spec.name}`,
            value: spec.value,
          })),
        ],
      },
      ...opts,
    })
    report.push(`${product.title}: описание и ${seed.specs.length} характеристик`)
  }
  if (missing) {
    report.push(`Не найдено товаров: ${missing}. Настройка будет повторена при следующей сборке.`)
    return report
  }
  await payload.create({
    collection: 'import-runs',
    data: { idempotencyKey: ARTEC_TEXTS_KEY, state: 'done', snapshot: { report } },
    ...opts,
  })
  return report
}
