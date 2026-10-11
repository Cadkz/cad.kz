import type { Payload } from 'payload'
import { mepTasksFor } from '../domain/mepTasks.mjs'
import { relIds } from './rel'

/** Ключ записи в журнале «Запуски импорта»: настройка выполняется один раз. */
export const MEP_TASKS_KEY = 'catalog-setup:mep-tasks-v1'
const opts = { overrideAccess: true, depth: 0 } as const

/** Задачи «Вентиляция…», «Отопление»… у товаров раздела «Инженерные сети». null — уже сделано. */
export async function setupMepTasks(payload: Payload): Promise<string[] | null> {
  const done = await payload.find({
    collection: 'import-runs',
    where: { idempotencyKey: { equals: MEP_TASKS_KEY } },
    limit: 1,
    ...opts,
  })
  if (done.docs.length) return null
  const section = await payload.find({
    collection: 'sections',
    where: { slug: { equals: 'mep' } },
    limit: 1,
    ...opts,
  })
  const mep = section.docs[0]?.id
  const report: string[] = []
  if (mep != null) {
    const { docs } = await payload.find({
      collection: 'products',
      pagination: false,
      select: {
        title: true,
        summary: true,
        searchAliases: true,
        description: true,
        sections: true,
        tasks: true,
      },
      ...opts,
    })
    for (const product of docs) {
      if (!relIds(product.sections).includes(mep)) continue
      const text = [
        product.title,
        product.summary,
        product.searchAliases,
        product.description?.slice(0, 600),
      ]
        .filter(Boolean)
        .join(' ')
      const current = (product.tasks ?? []).map((t) => t.title)
      const add = mepTasksFor(text, current)
      if (!add.length) continue
      await payload.update({
        collection: 'products',
        id: product.id,
        data: { tasks: [...(product.tasks ?? []), ...add.map((title) => ({ title }))] },
        ...opts,
      })
      report.push(`${product.title}: ${add.join(', ')}`)
    }
  }
  await payload.create({
    collection: 'import-runs',
    data: { idempotencyKey: MEP_TASKS_KEY, state: 'done', snapshot: { report } },
    ...opts,
  })
  return report
}
