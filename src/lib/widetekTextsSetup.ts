import type { Payload } from 'payload'
import research from '../domain/equipmentResearch.json' with { type: 'json' }
import { sitePhotos } from '../domain/sitePhotos.mjs'
import texts from '../domain/widetekTexts.json' with { type: 'json' }
import { researchDescription } from './equipmentResearchSetup'
import { relId, relIds } from './rel'

// Тексты 11 сканеров WideTEK от владельца (ChatGPT, пачка batch-widetek, 26.10.2026): краткое
// описание, описание (вступление + разделы) и характеристики по паспортам Image Access.
// Заменяют черновые тексты исследования 22.10.2026; утверждённых текстов у WideTEK не было.
// Описание, которое кто-то уже поменял в админке, не трогаем — товар попадёт в отчёт.
// Оговорки исследователя («по паспорту», «по брошюре») убраны при переносе в JSON.
// Фильтры каталога и сравнение для Кадди не меняем. Прежний текст — в «Истории» товара.

export const WIDETEK_TEXTS_KEY = 'catalog-setup:widetek-texts-2026-10-26'
const opts = { overrideAccess: true, depth: 0 } as const

export async function setupWidetekTexts(payload: Payload): Promise<string[] | null> {
  const done = await payload.find({
    collection: 'import-runs',
    where: { idempotencyKey: { equals: WIDETEK_TEXTS_KEY } },
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
    const before = research.products.find((entry) => entry.slug === seed.slug)
    const current = product.description?.trim() ?? ''
    if (current && (!before || current !== researchDescription(before).trim())) {
      report.push(`${product.title}: описание правили вручную — оставили как есть`)
      continue
    }
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
    data: { idempotencyKey: WIDETEK_TEXTS_KEY, state: 'done', snapshot: { report } },
    ...opts,
  })
  return report
}

/**
 * Решение владельца 26.10.2026: у сканеров WideTEK старые картинки Битрикса из галереи убрать —
 * на странице остаются только новые фото (src/domain/sitePhotos.mjs). Файлы в «Медиа» не
 * удаляются, вернуть можно в админке: товар → «Галерея». Товары без новых фото не трогаем.
 */
export const WIDETEK_GALLERY_KEY = 'catalog-setup:widetek-gallery-clear-2026-10-26'

export async function clearWidetekGallery(payload: Payload): Promise<string[] | null> {
  const done = await payload.find({
    collection: 'import-runs',
    where: { idempotencyKey: { equals: WIDETEK_GALLERY_KEY } },
    limit: 1,
    ...opts,
  })
  if (done.docs.length) return null
  const slugs = texts.map((entry) => entry.slug).filter((slug) => sitePhotos(slug).length > 0)
  const { docs } = await payload.find({
    collection: 'products',
    where: { slug: { in: slugs } },
    pagination: false,
    ...opts,
  })
  const report: string[] = []
  for (const product of docs) {
    const count = relIds(product.gallery).length
    if (!count) continue
    await payload.update({
      collection: 'products',
      id: product.id,
      data: {
        gallery: [],
        mainSection: relId(product.mainSection),
        extraSections: relIds(product.extraSections),
      },
      ...opts,
    })
    report.push(`${product.title}: убрано старых картинок — ${count}`)
  }
  if (docs.length < slugs.length) {
    report.push(`Не найдено товаров: ${slugs.length - docs.length}. Повторим при следующей сборке.`)
    return report
  }
  await payload.create({
    collection: 'import-runs',
    data: { idempotencyKey: WIDETEK_GALLERY_KEY, state: 'done', snapshot: { report } },
    ...opts,
  })
  return report
}
