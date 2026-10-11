import type { Payload } from 'payload'
import type { Product } from '../../payload-types'
import {
  GEO5_MAIN_TASKS,
  GEO5_OLD_TASKS,
  geoModuleTasks,
  geoPackageTasks,
} from '../domain/geoTasks.mjs'
import { relId } from './rel'

/** Ключ записи в журнале «Запуски импорта»: настройка выполняется один раз. */
export const GEO5_CATALOG_KEY = 'catalog-setup:geo5-catalog-v1'
const opts = { overrideAccess: true, depth: 0 } as const

const same = (a: string[], b: string[]) => a.length === b.length && a.every((x, i) => x === b[i])

/**
 * GEO5 в каталоге (решение владельца 12.10.2026): пакеты карточками, девять задач как на
 * geo5.kz. Вписанное вручную не трогаем. null — уже сделано.
 */
export async function setupGeo5Catalog(payload: Payload): Promise<string[] | null> {
  const done = await payload.find({
    collection: 'import-runs',
    where: { idempotencyKey: { equals: GEO5_CATALOG_KEY } },
    limit: 1,
    ...opts,
  })
  if (done.docs.length) return null
  const report: string[] = []
  const found = await payload.find({
    collection: 'products',
    where: { slug: { equals: 'geo5' } },
    limit: 1,
    ...opts,
  })
  const geo5 = found.docs[0]
  if (!geo5) report.push('GEO5 не найден (slug geo5)')
  else {
    const steps = geo5.picker?.steps ?? []
    const moduleIds = new Set<number>()
    const nextSteps = steps.map((step) => {
      const bundle = step.mode === 'bundle'
      const items = (step.items ?? []).map((item) => {
        const id = relId(item.product)
        if (id != null && id !== geo5.id) moduleIds.add(id)
        if (!bundle || (item.tasks ?? []).length) return item
        const tasks = geoPackageTasks(item.label ?? '')
        if (tasks.length) report.push(`Пакет ${item.label}: ${tasks.join(', ')}`)
        return { ...item, tasks }
      })
      return { ...step, items, inCatalog: bundle ? true : step.inCatalog }
    })
    const current = (geo5.tasks ?? []).map((task) => task.title)
    const tasksChanged = !current.length || same(current, GEO5_OLD_TASKS)
    const data: Partial<Product> = {
      picker: { ...geo5.picker, steps: nextSteps },
      ...(tasksChanged ? { tasks: GEO5_MAIN_TASKS.map((title) => ({ title })) } : {}),
    }
    await payload.update({ collection: 'products', id: geo5.id, data, ...opts })
    report.push(
      tasksChanged
        ? `GEO5: задачи в шапке — ${GEO5_MAIN_TASKS.join(', ')}`
        : 'GEO5: задачи в шапке правили вручную, не трогаем',
    )

    if (moduleIds.size) {
      const modules = await payload.find({
        collection: 'products',
        where: { id: { in: [...moduleIds] } },
        pagination: false,
        select: { title: true, tasks: true },
        ...opts,
      })
      for (const module of modules.docs) {
        if ((module.tasks ?? []).length) continue
        const tasks = geoModuleTasks(module.title)
        if (!tasks.length) {
          report.push(`${module.title}: задача не подобрана`)
          continue
        }
        await payload.update({
          collection: 'products',
          id: module.id,
          data: { tasks: tasks.map((title) => ({ title })) },
          ...opts,
        })
        report.push(`${module.title}: ${tasks.join(', ')}`)
      }
    }
  }
  await payload.create({
    collection: 'import-runs',
    data: { idempotencyKey: GEO5_CATALOG_KEY, state: 'done', snapshot: { report } },
    ...opts,
  })
  return report
}
