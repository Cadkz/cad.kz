import type { Payload } from 'payload'
import { mergeSpecs, PROGRAM_TEXTS } from '../domain/programTexts.mjs'
import { relId, relIds } from './rel'

/**
 * Тексты 6 программ от владельца (ChatGPT, 23.10.2026), разово при сборке: краткое описание,
 * описание и характеристики. Прежний текст остаётся в «Истории» товара — откат одной кнопкой.
 * Название и картинки не трогаем.
 */
export const PROGRAM_TEXTS_KEY = 'catalog-setup:program-texts-2026-10-23'
const opts = { overrideAccess: true, depth: 0 } as const

export async function setupProgramTexts(payload: Payload): Promise<string[] | null> {
  const done = await payload.find({
    collection: 'import-runs',
    where: { idempotencyKey: { equals: PROGRAM_TEXTS_KEY } },
    limit: 1,
    ...opts,
  })
  if (done.docs.length) return null
  const { docs } = await payload.find({
    collection: 'products',
    where: { slug: { in: PROGRAM_TEXTS.flatMap((entry) => entry.slugs) } },
    pagination: false,
    ...opts,
  })
  const report: string[] = []
  for (const text of PROGRAM_TEXTS) {
    // Первый найденный адрес из списка — карточка программы.
    const product = text.slugs
      .map((slug) => docs.find((entry) => entry.slug === slug))
      .find((entry) => entry !== undefined)
    if (!product) {
      report.push(`${text.slugs.join(' / ')}: товара нет — пропустили`)
      continue
    }
    await payload.update({
      collection: 'products',
      id: product.id,
      data: {
        summary: text.summary,
        description: text.description,
        properties: mergeSpecs(product.properties ?? [], text.specs),
        mainSection: relId(product.mainSection),
        extraSections: relIds(product.extraSections),
      },
      ...opts,
    })
    report.push(`${product.title}: новый текст и характеристики`)
  }
  await payload.create({
    collection: 'import-runs',
    data: { idempotencyKey: PROGRAM_TEXTS_KEY, state: 'done', snapshot: { report } },
    ...opts,
  })
  return report
}
