import type { Payload } from 'payload'
import type { Product } from '../../payload-types'
import { AUTOCAD_PICKER, PICKER_V3_RENAMES, SCAD_PICKER } from '../domain/pickerSeed.mjs'

/** Ключ записи в журнале «Запуски импорта»: настройка выполняется один раз. */
export const PICKER_SETUP_V3_KEY = 'catalog-setup:picker-v3'
const opts = { overrideAccess: true, depth: 0 } as const

type Picker = NonNullable<Product['picker']>
type Step = NonNullable<Picker['steps']>[number]
type Item = NonNullable<Step['items']>[number]

const stepRenames: Record<string, string> = PICKER_V3_RENAMES.steps
const itemRenames: Record<string, string> = PICKER_V3_RENAMES.items

/**
 * Обновить подбор по черновику, не трогая выбранные в админке товары и предложения: шаги и варианты
 * находятся по старому или новому названию, берутся новые название, подсказка, пояснение и
 * «Выбран сразу». Варианты готовых комплектов — в порядке черновика (по цене).
 */
function renamed(picker: Picker, seed: typeof SCAD_PICKER | typeof AUTOCAD_PICKER): Picker {
  const seedSteps = seed.steps
  const steps = (picker.steps ?? []).map((step): Step => {
    const title = stepRenames[step.title] ?? step.title
    const seedStep = seedSteps.find((s) => s.title === title)
    if (!seedStep) return step
    const seedItems = seedStep.items ?? []
    const items = (step.items ?? []).map((item): Item => {
      if (!item.label) return item
      const label = itemRenames[item.label] ?? item.label
      const seedItem = seedItems.find((s) => s.label === label)
      if (!seedItem) return item
      return { ...item, label, note: seedItem.note ?? null, preselect: Boolean(seedItem.preselect) }
    })
    if (seedStep.mode === 'bundle') {
      const order = (item: Item) => {
        const index = seedItems.findIndex((s) => s.label === item.label)
        return index < 0 ? seedItems.length : index
      }
      items.sort((a, b) => order(a) - order(b))
    }
    return { ...step, title, hint: seedStep.hint ?? null, items }
  })
  const switches = (picker.switches ?? []).map((sw) =>
    sw.title === seed.switch.title
      ? {
          ...sw,
          options: (sw.options ?? []).map((option) => ({
            ...option,
            note: seed.switch.options.find((o) => o.value === option.value)?.note ?? option.note,
          })),
        }
      : sw,
  )
  return { ...picker, switches, steps }
}

/** Пакет C: понятные названия в подборе SCAD Office и AutoCAD. Один раз (отметка в журнале). */
export async function setupPickerV3(payload: Payload): Promise<string[] | null> {
  const done = await payload.find({
    collection: 'import-runs',
    where: { idempotencyKey: { equals: PICKER_SETUP_V3_KEY } },
    limit: 1,
    ...opts,
  })
  if (done.docs.length) return null
  const report: string[] = []
  for (const seed of [SCAD_PICKER, AUTOCAD_PICKER]) {
    const found = await payload.find({
      collection: 'products',
      where: { slug: { equals: seed.slug } },
      limit: 1,
      ...opts,
    })
    const product = found.docs[0]
    if (!product?.picker || product.pageView !== 'picker') {
      report.push(`нет подбора: ${seed.slug}`)
      continue
    }
    await payload.update({
      collection: 'products',
      id: product.id,
      data: { picker: renamed(product.picker, seed) },
      ...opts,
    })
    report.push(product.title)
  }
  await payload.create({
    collection: 'import-runs',
    data: { idempotencyKey: PICKER_SETUP_V3_KEY, state: 'done', snapshot: { report } },
    ...opts,
  })
  return report
}
