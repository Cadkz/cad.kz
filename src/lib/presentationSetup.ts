import type { Payload } from 'payload'
import type { Product } from '../../payload-types'
import {
  ARTEC_SCANNERS,
  ARTEC_SOFTWARE,
  DEMO_PUBLICATION_SLUGS,
  fixPageBody,
  PURCHASE_TERMS,
  SCAD_CROSS,
  SCAD_RENAMES,
} from '../domain/presentationFixes.mjs'
import { relIds } from './rel'

/** Ключ записи в журнале «Запуски импорта»: настройка выполняется один раз. */
export const PRESENTATION_SETUP_KEY = 'catalog-setup:presentation-2026-11-03'
const opts = { overrideAccess: true, depth: 0 } as const

type Picker = NonNullable<Product['picker']>
const stepRenames: Record<string, { title: string; hint: string }> = SCAD_RENAMES.steps

/** Подбор SCAD Office: новые названия шага и комплектов, выбранные товары не трогаются. */
function scadPicker(picker: Picker): Picker {
  return {
    ...picker,
    steps: (picker.steps ?? []).map((step) => {
      const renamed = stepRenames[step.title]
      return {
        ...step,
        ...(renamed ? { title: renamed.title, hint: renamed.hint } : {}),
        items: (step.items ?? []).map((item) => {
          const next = item.label ? SCAD_RENAMES.items[item.label] : undefined
          return next ? { ...item, label: next.label, note: next.note } : item
        }),
      }
    }),
  }
}

async function hideDemoPublications(payload: Payload, report: string[]) {
  const { docs } = await payload.find({
    collection: 'publications',
    where: {
      and: [{ slug: { in: DEMO_PUBLICATION_SLUGS } }, { status: { equals: 'published' } }],
    },
    limit: 50,
    ...opts,
  })
  for (const doc of docs)
    await payload.update({
      collection: 'publications',
      id: doc.id,
      data: { status: 'draft' },
      ...opts,
    })
  report.push(`Демопубликации скрыты: ${docs.map((doc) => doc.title).join('; ') || 'нет'}`)
}

async function renameScad(payload: Payload, report: string[]) {
  const { docs } = await payload.find({
    collection: 'products',
    where: { slug: { equals: SCAD_RENAMES.slug } },
    limit: 1,
    ...opts,
  })
  const product = docs[0]
  if (!product) return void report.push('SCAD Office не найден')
  const title = SCAD_RENAMES.oldTitle.test(product.title) ? SCAD_RENAMES.title : product.title
  await payload.update({
    collection: 'products',
    id: product.id,
    data: { title, ...(product.picker ? { picker: scadPicker(product.picker) } : {}) },
    ...opts,
  })
  report.push(`SCAD Office: «${product.title}» → «${title}», комплекты переименованы`)
}

/** Первый опубликованный товар, чьё название подходит под каждое правило, — по порядку. */
async function findByTitles(payload: Payload, patterns: RegExp[]) {
  const { docs } = await payload.find({
    collection: 'products',
    where: { status: { equals: 'published' } },
    pagination: false,
    select: { title: true, pageView: true },
    ...opts,
  })
  return patterns.flatMap((pattern) => {
    const found = docs.find((doc) => doc.pageView !== 'none' && pattern.test(doc.title))
    return found ? [found.id] : []
  })
}

async function setRecommended(
  payload: Payload,
  report: string[],
  match: (slug: string) => boolean,
  ids: number[],
  label: string,
) {
  if (!ids.length) return void report.push(`${label}: товары для подборки не найдены`)
  const { docs } = await payload.find({
    collection: 'products',
    pagination: false,
    select: { slug: true, title: true, recommended: true },
    ...opts,
  })
  const changed: string[] = []
  for (const doc of docs) {
    if (!match(doc.slug) || relIds(doc.recommended).length) continue
    await payload.update({
      collection: 'products',
      id: doc.id,
      data: { recommended: ids },
      ...opts,
    })
    changed.push(doc.title)
  }
  report.push(`${label}: «С этим покупают» поставлено у ${changed.join(', ') || 'никого'}`)
}

async function fixPages(payload: Payload, report: string[]) {
  const { docs } = await payload.find({
    collection: 'pages',
    where: { slug: { in: ['delivery', 'guaranty', 'howto'] } },
    limit: 10,
    ...opts,
  })
  for (const page of docs) {
    const body = page.body ?? ''
    const fixed = fixPageBody(page.slug, body)
    if (fixed === body) continue
    await payload.update({ collection: 'pages', id: page.id, data: { body: fixed }, ...opts })
    report.push(`Страница «${page.title}»: исправлены опечатки и подписи`)
  }
}

async function fillPurchaseTerms(payload: Payload, report: string[]) {
  const settings = await payload.findGlobal({ slug: 'site-settings', ...opts })
  const current = settings.purchaseTerms
  if (current?.software?.length || current?.hardware?.length)
    return void report.push('Условия покупки уже заполнены в админке')
  await payload.updateGlobal({
    slug: 'site-settings',
    data: { purchaseTerms: PURCHASE_TERMS },
    ...opts,
  })
  report.push('Условия покупки заполнены: программы и оборудование')
}

/** Правки к презентации 03.11.2026. Один раз (отметка в журнале «Запуски импорта»). */
export async function setupPresentation(payload: Payload): Promise<string[] | null> {
  const done = await payload.find({
    collection: 'import-runs',
    where: { idempotencyKey: { equals: PRESENTATION_SETUP_KEY } },
    limit: 1,
    ...opts,
  })
  if (done.docs.length) return null
  const report: string[] = []
  await hideDemoPublications(payload, report)
  await renameScad(payload, report)
  await setRecommended(
    payload,
    report,
    (slug) => ARTEC_SCANNERS.test(slug),
    await findByTitles(payload, ARTEC_SOFTWARE),
    'Сканеры Artec',
  )
  await setRecommended(
    payload,
    report,
    (slug) => slug === SCAD_RENAMES.slug,
    await findByTitles(payload, SCAD_CROSS),
    'SCAD Office',
  )
  await fixPages(payload, report)
  await fillPurchaseTerms(payload, report)
  await payload.create({
    collection: 'import-runs',
    data: { idempotencyKey: PRESENTATION_SETUP_KEY, state: 'done', snapshot: { report } },
    ...opts,
  })
  return report
}
