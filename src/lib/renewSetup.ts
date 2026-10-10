import type { Payload } from 'payload'
import { EXTRA_ORDER, RENEW_FAMILIES } from '../domain/familySeed.mjs'

/** Ключ записи в журнале «Запуски импорта»: настройка выполняется один раз. */
export const RENEW_SETUP_KEY = 'catalog-setup:passat-renew-v1'
const opts = { overrideAccess: true, depth: 0 } as const

type Report = { families: string[]; drafts: number; missing: string[] }

/**
 * Продления и обновления семейства (ПАССАТ и Штуцер-МКЭ) — в черновики, у семейства кнопка
 * «Обновить версию»: клиент отмечает свои программы, менеджер сам уточняет лицензию.
 * Выполняется один раз (отметка в журнале).
 */
export async function setupFamilyRenew(payload: Payload): Promise<Report | null> {
  const done = await payload.find({
    collection: 'import-runs',
    where: { idempotencyKey: { equals: RENEW_SETUP_KEY } },
    limit: 1,
    ...opts,
  })
  if (done.docs.length) return null
  const report: Report = { families: [], drafts: 0, missing: [] }
  for (const seed of RENEW_FAMILIES) {
    const found = await payload.find({
      collection: 'product-lines',
      where: { slug: { equals: seed.slug } },
      limit: 1,
      ...opts,
    })
    const line = found.docs[0]
    if (!line) {
      report.missing.push(seed.slug)
      continue
    }
    await payload.update({
      collection: 'product-lines',
      id: line.id,
      data: { renewLabel: seed.renewLabel },
      ...opts,
    })
    const extras = await payload.update({
      collection: 'products',
      where: {
        and: [
          { line: { equals: line.id } },
          { lineOrder: { greater_than_equal: EXTRA_ORDER } },
          { status: { equals: 'published' } },
        ],
      },
      data: { status: 'draft' },
      ...opts,
    })
    report.drafts += extras.docs.length
    report.families.push(`${line.title}: в черновики ${extras.docs.length}`)
  }
  await payload.create({
    collection: 'import-runs',
    data: { idempotencyKey: RENEW_SETUP_KEY, state: 'done', snapshot: report },
    ...opts,
  })
  return report
}
