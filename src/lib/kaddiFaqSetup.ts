import type { Payload } from 'payload'
import { KADDI_FAQ, KADDI_FAQ_2 } from '../domain/kaddiFaq.mjs'

/**
 * Справка Кадди по отчёту «Проверки Кадди» 30.10.2026, разово при сборке: записи базы знаний
 * из `src/domain/kaddiFaq.mjs`. Запись с тем же ключом в поле «Продукт» обновляется, новой — создаётся.
 * Дальше маркетолог правит их в админке «База знаний Кадди»: повторно настройка не запускается.
 */
export const KADDI_FAQ_KEY = 'catalog-setup:kaddi-faq-2026-10-30'
/** Второй прогон проверки 30.10.2026: новые записи и уточнённая запись о вакансиях. */
export const KADDI_FAQ_2_KEY = 'catalog-setup:kaddi-faq-2026-10-30-b'
const opts = { overrideAccess: true, depth: 0 } as const

export function setupKaddiFaq(payload: Payload): Promise<string[] | null> {
  return setupFaq(payload, KADDI_FAQ_KEY, KADDI_FAQ, 900)
}

export function setupKaddiFaq2(payload: Payload): Promise<string[] | null> {
  return setupFaq(payload, KADDI_FAQ_2_KEY, KADDI_FAQ_2, 920)
}

async function setupFaq(
  payload: Payload,
  key: string,
  entries: { key: string; text: string }[],
  start: number,
): Promise<string[] | null> {
  const done = await payload.find({
    collection: 'import-runs',
    where: { idempotencyKey: { equals: key } },
    limit: 1,
    ...opts,
  })
  if (done.docs.length) return null
  const report: string[] = []
  for (const [index, entry] of entries.entries()) {
    const existing = await payload.find({
      collection: 'assistant-knowledge',
      where: { product: { equals: entry.key } },
      limit: 1,
      ...opts,
    })
    const data = { product: entry.key, text: entry.text, active: true, position: start + index }
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
    data: { idempotencyKey: key, state: 'done', snapshot: { report } },
    ...opts,
  })
  return report
}
