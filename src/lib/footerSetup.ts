import type { Payload } from 'payload'
import { footerSettingsPatch } from '../domain/footerContacts.mjs'

/** Ключ записи в журнале «Запуски импорта»: настройка выполняется один раз. */
export const FOOTER_AUDIT_KEY = 'footer-setup:audit-v1'
const opts = { overrideAccess: true, depth: 0 } as const

/**
 * «Контакты и подвал» по аудиту 21.10.2026 (Г9, Т3): основной городской номер и адрес
 * офиса со старого cad.kz, новое описание компании. Правленное в админке не трогает.
 * Возвращает строки для журнала сборки или null, если уже выполнялась.
 */
export async function setupFooterAudit(payload: Payload): Promise<string[] | null> {
  const found = await payload.find({
    collection: 'import-runs',
    where: { idempotencyKey: { equals: FOOTER_AUDIT_KEY } },
    limit: 1,
    ...opts,
  })
  if (found.docs.length > 0) return null
  const settings = await payload.findGlobal({ slug: 'site-settings', ...opts })
  const { data, changed } = footerSettingsPatch(settings)
  if (changed.length) await payload.updateGlobal({ slug: 'site-settings', data, ...opts })
  await payload.create({
    collection: 'import-runs',
    data: { idempotencyKey: FOOTER_AUDIT_KEY, state: 'done', snapshot: { changed } },
    ...opts,
  })
  return changed.length ? changed : ['всё уже заполнено в админке, не трогаем']
}
