import type { Payload } from 'payload'
import { UNDATED_PUBLICATIONS } from '../domain/presentationFixes.mjs'

/** Ключ записи в журнале «Запуски импорта»: настройка выполняется один раз. */
export const UNDATED_SETUP_KEY = 'catalog-setup:undated-publications-2026-11-02'
const opts = { overrideAccess: true, depth: 0 } as const

/**
 * Даты публикациям без даты (аудит 02.11.2026, пакет 3): без неё новость стоит первой в списке
 * и на карточке нет даты. Дата ставится, только если её по-прежнему нет. Один раз.
 */
export async function setupUndatedPublications(payload: Payload): Promise<string[] | null> {
  const done = await payload.find({
    collection: 'import-runs',
    where: { idempotencyKey: { equals: UNDATED_SETUP_KEY } },
    limit: 1,
    ...opts,
  })
  if (done.docs.length) return null
  const report: string[] = []
  const { docs } = await payload.find({
    collection: 'publications',
    where: { publishedAt: { exists: false } },
    pagination: false,
    ...opts,
  })
  for (const doc of docs) {
    const date = UNDATED_PUBLICATIONS[doc.slug]
    if (!date) {
      if (doc.status === 'published') report.push(`Без даты осталась: «${doc.title}»`)
      continue
    }
    await payload.update({
      collection: 'publications',
      id: doc.id,
      data: { publishedAt: date },
      ...opts,
    })
    report.push(`«${doc.title}»: дата ${date.slice(0, 10)}`)
  }
  if (!report.length) report.push('Публикаций без даты нет')
  await payload.create({
    collection: 'import-runs',
    data: { idempotencyKey: UNDATED_SETUP_KEY, state: 'done', snapshot: { report } },
    ...opts,
  })
  return report
}
