import type { Payload } from 'payload'
import { KADDI_FAQ } from '../domain/kaddiFaq.mjs'

/**
 * Справка Кадди по отчёту «Проверки Кадди» 30.10.2026, разово при сборке: записи базы знаний
 * из `src/domain/kaddiFaq.mjs`. Запись с тем же ключом в поле «Продукт» обновляется, новой — создаётся.
 * Дальше маркетолог правит их в админке «База знаний Кадди»: повторно настройка не запускается.
 */
export const KADDI_FAQ_KEY = 'catalog-setup:kaddi-faq-2026-10-30'
const opts = { overrideAccess: true, depth: 0 } as const

export async function setupKaddiFaq(payload: Payload): Promise<string[] | null> {
  const done = await payload.find({
    collection: 'import-runs',
    where: { idempotencyKey: { equals: KADDI_FAQ_KEY } },
    limit: 1,
    ...opts,
  })
  if (done.docs.length) return null
  const report: string[] = []
  for (const [index, entry] of KADDI_FAQ.entries()) {
    const existing = await payload.find({
      collection: 'assistant-knowledge',
      where: { product: { equals: entry.key } },
      limit: 1,
      ...opts,
    })
    const data = { product: entry.key, text: entry.text, active: true, position: 900 + index }
    const found = existing.docs[0]
    if (found) {
      await payload.update({ collection: 'assistant-knowledge', id: found.id, data, ...opts })
      report.push(`обновлена: ${entry.key}`)
    } else {
      await payload.create({ collection: 'assistant-knowledge', data, ...opts })
      report.push(`добавлена: ${entry.key}`)
    }
  }
  await payload.create({
    collection: 'import-runs',
    data: { idempotencyKey: KADDI_FAQ_KEY, state: 'done', snapshot: { report } },
    ...opts,
  })
  return report
}
