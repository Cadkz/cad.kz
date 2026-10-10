import type { Payload } from 'payload'
import { TRUST_SEED } from '../domain/homeTrust.mjs'

/** Ключ записи в журнале «Запуски импорта»: настройка выполняется один раз. */
export const HOME_TRUST_KEY = 'home-setup:trust-v1'
const opts = { overrideAccess: true, depth: 0 } as const

/**
 * Блок «Официальный партнёр» на главной: заполняет его подтверждёнными статусами, если в админке
 * он ещё пуст. Заполненный редактором блок не трогает. Выполняется один раз (отметка в журнале).
 */
export async function setupHomeTrust(payload: Payload): Promise<'filled' | 'kept' | null> {
  const done = await payload.find({
    collection: 'import-runs',
    where: { idempotencyKey: { equals: HOME_TRUST_KEY } },
    limit: 1,
    ...opts,
  })
  if (done.docs.length) return null
  const home = await payload.findGlobal({ slug: 'home-page', ...opts })
  const empty = !home.trust?.partners?.length
  if (empty) await payload.updateGlobal({ slug: 'home-page', data: { trust: TRUST_SEED }, ...opts })
  const result = empty ? 'filled' : 'kept'
  await payload.create({
    collection: 'import-runs',
    data: { idempotencyKey: HOME_TRUST_KEY, state: 'done', snapshot: { trust: result } },
    ...opts,
  })
  return result
}
