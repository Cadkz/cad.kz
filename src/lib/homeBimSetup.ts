import type { Payload } from 'payload'
import { HOME_BIM, OLD_BIM_TITLE } from '../domain/homeBimText.mjs'

/** Ключ записи в журнале «Запуски импорта»: настройка выполняется один раз. */
export const HOME_BIM_KEY = 'home-bim:short-v1'
const opts = { overrideAccess: true, depth: 0 } as const

/**
 * Баннер «Внедрение BIM» на главной — короткий текст (src/domain/homeBimText.mjs). Меняет, только
 * если в админке стоит прежний заголовок: правленное владельцем не трогает.
 */
export async function setupHomeBim(payload: Payload): Promise<string[] | null> {
  const found = await payload.find({
    collection: 'import-runs',
    where: { idempotencyKey: { equals: HOME_BIM_KEY } },
    limit: 1,
    ...opts,
  })
  if (found.docs.length > 0) return null
  const home = await payload.findGlobal({ slug: 'home-page', ...opts })
  const changed = home.bim?.title === OLD_BIM_TITLE
  if (changed)
    await payload.updateGlobal({
      slug: 'home-page',
      data: { bim: { ...home.bim, ...HOME_BIM } },
      ...opts,
    })
  await payload.create({
    collection: 'import-runs',
    data: { idempotencyKey: HOME_BIM_KEY, state: 'done', snapshot: { changed } },
    ...opts,
  })
  return [changed ? 'баннер BIM на главной сокращён' : 'баннер BIM правили в админке — не трогаем']
}
