import type { Payload } from 'payload'
import texts from '../domain/softwareTexts.json' with { type: 'json' }
import { relId, relIds } from './rel'

// Тексты 7 программ от владельца (ChatGPT, пачка batch-software, 26.10.2026): Civil 3D, Inventor,
// Navisworks, 3ds Max, AEC Collection, АВС-KZ, СПДС GraphiCS — краткое описание, описание
// (вступление + разделы) и характеристики по сайтам и статьям поддержки производителей.
// У AutoCAD, Revit, SCAD Office, ЛИРА-FEM, Fusion и GEO5 тексты утверждены 23.10 — в пачке их
// и нет. Платформы nanoCAD на сайте нет отдельным товаром — её текст не взят. Оговорки
// исследователя («изображения в карточке не являются…», «на официальной странице указаны»)
// убраны при переносе в JSON. Прежний текст — в «Истории» товара.

export const SOFTWARE_TEXTS_KEY = 'catalog-setup:software-texts-2026-10-26'
const opts = { overrideAccess: true, depth: 0 } as const

export async function setupSoftwareTexts(payload: Payload): Promise<string[] | null> {
  const done = await payload.find({
    collection: 'import-runs',
    where: { idempotencyKey: { equals: SOFTWARE_TEXTS_KEY } },
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
    data: { idempotencyKey: SOFTWARE_TEXTS_KEY, state: 'done', snapshot: { report } },
    ...opts,
  })
  return report
}
