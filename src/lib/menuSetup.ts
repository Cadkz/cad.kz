import type { Payload } from 'payload'
import { MENU_RENAMES } from '../domain/menuSeed.mjs'

/** Ключ записи в журнале «Запуски импорта»: настройка выполняется один раз. */
export const MENU_SETUP_KEY = 'catalog-setup:menu-v1'
const opts = { overrideAccess: true, depth: 0 } as const

/**
 * Названия разделов для меню по варианту А. Раздел, переименованный в админке, не трогаем.
 * null — уже сделано.
 */
export async function setupMenu(payload: Payload): Promise<string[] | null> {
  const done = await payload.find({
    collection: 'import-runs',
    where: { idempotencyKey: { equals: MENU_SETUP_KEY } },
    limit: 1,
    ...opts,
  })
  if (done.docs.length) return null

  const report: string[] = []
  const { docs } = await payload.find({
    collection: 'sections',
    where: { slug: { in: Object.keys(MENU_RENAMES) } },
    pagination: false,
    ...opts,
  })
  for (const section of docs) {
    const rename = MENU_RENAMES[section.slug]
    if (!rename) continue
    const [from, to] = rename
    if (section.title !== from) {
      report.push(`Раздел «${section.title}» правили в админке — не трогаем`)
      continue
    }
    await payload.update({ collection: 'sections', id: section.id, data: { title: to }, ...opts })
    report.push(`Раздел переименован: ${from} → ${to}`)
  }

  await payload.create({
    collection: 'import-runs',
    data: { idempotencyKey: MENU_SETUP_KEY, state: 'done', snapshot: { report } },
    ...opts,
  })
  return report
}
