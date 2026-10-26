import type { Payload } from 'payload'
import texts from '../domain/artecSoftwareTexts.json' with { type: 'json' }
import { relId, relIds } from './rel'

// Тексты Artec Studio и Artec Cloud от владельца (ChatGPT, пачка batch-artec, 26.10.2026):
// краткое описание, описание (вступление + разделы) и характеристики по artec3d.com и руководству
// Artec Studio 20. Сейчас у этих программ прежние тексты Битрикса (владелец вернул их 23.10.2026
// вместо текстов исследования), новые он заказал сам. Прежний текст — в «Истории» товара.
// Тексты сканеров Artec утверждены раньше (artecTextsSetup, artecNewScanners) — их не трогаем.
// Оговорки исследователя («универсальная конфигурация не задаётся») убраны при переносе в JSON.

export const ARTEC_SOFTWARE_TEXTS_KEY = 'catalog-setup:artec-software-texts-2026-10-26'
const opts = { overrideAccess: true, depth: 0 } as const

export async function setupArtecSoftwareTexts(payload: Payload): Promise<string[] | null> {
  const done = await payload.find({
    collection: 'import-runs',
    where: { idempotencyKey: { equals: ARTEC_SOFTWARE_TEXTS_KEY } },
    limit: 1,
    ...opts,
  })
  if (done.docs.length) return null
  const { docs } = await payload.find({
    collection: 'products',
    where: { slug: { in: texts.map((entry) => entry.slug) } },
    pagination: false,
    ...opts,
  })
  const report: string[] = []
  let missing = 0
  for (const seed of texts) {
    const product = docs.find((entry) => entry.slug === seed.slug)
    if (!product) {
      missing++
      report.push(`Не найден товар: ${seed.slug}`)
      continue
    }
    // Повтор после сбоя: уже загруженное не трогаем.
    if (product.description === seed.description) continue
    await payload.update({
      collection: 'products',
      id: product.id,
      data: {
        summary: seed.summary,
        description: seed.description,
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
        mainSection: relId(product.mainSection),
        extraSections: relIds(product.extraSections),
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
    data: { idempotencyKey: ARTEC_SOFTWARE_TEXTS_KEY, state: 'done', snapshot: { report } },
    ...opts,
  })
  return report
}
