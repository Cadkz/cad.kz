import type { Payload } from 'payload'
import { MACHINE_SUMMARY_FIX, RENEW_LABEL_FIX, replaceIfOld } from '../domain/textsAudit.mjs'

/** Ключ записи в журнале «Запуски импорта»: настройка выполняется один раз. */
export const TEXTS_AUDIT_KEY = 'texts-setup:audit-v1'
const opts = { overrideAccess: true, depth: 0 } as const

/**
 * Тексты из базы по аудиту 21.10.2026, пакет 5: «Продлить подписку» → «Продлить лицензию»
 * у товаров (Т7), описание «Машиностроения» (Т21). Правленное в админке не трогает.
 * Возвращает строки для журнала сборки или null, если уже выполнялась.
 */
export async function setupTextsAudit(payload: Payload): Promise<string[] | null> {
  const found = await payload.find({
    collection: 'import-runs',
    where: { idempotencyKey: { equals: TEXTS_AUDIT_KEY } },
    limit: 1,
    ...opts,
  })
  if (found.docs.length > 0) return null
  const report: string[] = []

  const renew = await payload.find({
    collection: 'products',
    where: { renewLabel: { equals: RENEW_LABEL_FIX[0] } },
    pagination: false,
    select: { title: true },
    ...opts,
  })
  for (const product of renew.docs)
    await payload.update({
      collection: 'products',
      id: product.id,
      data: { renewLabel: RENEW_LABEL_FIX[1] },
      ...opts,
    })
  if (renew.docs.length)
    report.push(
      `«${RENEW_LABEL_FIX[1]}» вместо «${RENEW_LABEL_FIX[0]}»: ${renew.docs.map((p) => p.title).join(', ')}`,
    )

  const machine = await payload.find({
    collection: 'sections',
    where: { slug: { equals: 'machine' } },
    limit: 1,
    ...opts,
  })
  const section = machine.docs[0]
  const summary = section ? replaceIfOld(section.summary, MACHINE_SUMMARY_FIX) : null
  if (section && summary) {
    await payload.update({ collection: 'sections', id: section.id, data: { summary }, ...opts })
    report.push('Описание «Машиностроения» — с программами')
  }

  await payload.create({
    collection: 'import-runs',
    data: { idempotencyKey: TEXTS_AUDIT_KEY, state: 'done', snapshot: { report } },
    ...opts,
  })
  return report.length ? report : ['всё уже правили в админке, не трогаем']
}
