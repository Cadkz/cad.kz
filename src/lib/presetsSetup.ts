import type { Payload } from 'payload'
import { PRESETS, presetColumns, presetWhere } from '../domain/presetSeed.mjs'
import { refreshQuality } from './productQuality'

/** Ключ записи в журнале «Запуски импорта»: готовые виды создаются один раз. */
export const PRESETS_SETUP_KEY = 'admin-setup:query-presets-v1'
const opts = { overrideAccess: true, depth: 0 } as const

/**
 * Готовые виды списков (src/domain/presetSeed.mjs): общие, видят все, менять — администратор.
 * Вид с тем же названием в том же списке не дублируется. null — уже сделано.
 */
export async function setupPresets(payload: Payload): Promise<string[] | null> {
  const done = await payload.find({
    collection: 'import-runs',
    where: { idempotencyKey: { equals: PRESETS_SETUP_KEY } },
    limit: 1,
    ...opts,
  })
  if (done.docs.length) return null

  const report: string[] = []
  for (const preset of PRESETS) {
    const existing = await payload.find({
      collection: 'payload-query-presets',
      where: {
        and: [
          { title: { equals: preset.title } },
          { relatedCollection: { equals: preset.collection } },
        ],
      },
      limit: 1,
      ...opts,
    })
    if (existing.docs.length) continue
    await payload.create({
      collection: 'payload-query-presets',
      data: {
        title: preset.title,
        relatedCollection: preset.collection,
        isShared: true,
        access: {
          read: { constraint: 'everyone' },
          update: { constraint: 'admins' },
          delete: { constraint: 'admins' },
        },
        where: presetWhere(preset.where),
        columns: presetColumns(preset.columns),
      },
      ...opts,
    })
    report.push(`${preset.collection}: ${preset.title}`)
  }
  await payload.create({
    collection: 'import-runs',
    data: { idempotencyKey: PRESETS_SETUP_KEY, state: 'done', snapshot: { report } },
    ...opts,
  })
  return report
}

/** Отметка заполненности у всех товаров: при каждой сборке, пишет только изменившиеся. */
export async function setupQuality(payload: Payload): Promise<number> {
  return refreshQuality(payload, null)
}
