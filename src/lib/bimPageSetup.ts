import type { Payload } from 'payload'
import { BIM_PAGE } from '../domain/bimPageText.mjs'

/** Ключ записи в журнале «Запуски импорта»: настройка выполняется один раз. */
export const BIM_PAGE_KEY = 'bim-page:owner-2026-11-06'
const opts = { overrideAccess: true, depth: 0 } as const

/** «Страница BIM» — текст владельца (src/domain/bimPageText.mjs), если в админке ещё пусто. */
export async function setupBimPageTexts(payload: Payload): Promise<string[] | null> {
  const found = await payload.find({
    collection: 'import-runs',
    where: { idempotencyKey: { equals: BIM_PAGE_KEY } },
    limit: 1,
    ...opts,
  })
  if (found.docs.length > 0) return null
  const page = await payload.findGlobal({ slug: 'bim-page', locale: 'ru', ...opts })
  const empty = !page.intro?.title && !(page.services ?? []).length
  if (empty) await payload.updateGlobal({ slug: 'bim-page', data: BIM_PAGE, locale: 'ru', ...opts })
  await payload.create({
    collection: 'import-runs',
    data: { idempotencyKey: BIM_PAGE_KEY, state: 'done', snapshot: { filled: empty } },
    ...opts,
  })
  return [empty ? 'текст страницы заполнен' : 'страницу уже правили в админке — не трогаем']
}
