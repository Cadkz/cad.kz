import type { Payload } from 'payload'
import type { Product } from '../../payload-types'
import {
  JET_SLUG,
  METROLOGY_SLUG,
  NEW_SCANNERS,
  SCANNER_TEMPLATE,
  type ScannerSeed,
} from '../domain/artecNewScanners.mjs'
import { defaultScanIds } from '../domain/artecScans.mjs'
import texts from '../domain/artecTexts.json' with { type: 'json' }
import { relId, relIds } from './rel'

/**
 * Сканеры Artec по решениям владельца 24.10.2026, разово при сборке:
 * 1) метрологический набор больше нигде не предлагается: убран из подборов всех товаров
 *    и скрыт с сайта (в подборе сканера остаются только Artec Studio и Artec Cloud);
 * 2) новые карточки Artec Point II и Artec Neo (по образцу Artec Leo: производитель, линейка,
 *    разделы, подбор «сканер + программы»), Artec Jet показывается, а если его нет — создаётся;
 * 3) «Примеры сканов» в админке заполняются готовыми сканами каждой модели (только пустые).
 */
export const ARTEC_SCANNERS_KEY = 'catalog-setup:artec-scanners-v2'
const opts = { overrideAccess: true, depth: 0 } as const

type Steps = NonNullable<NonNullable<Product['picker']>['steps']>
type ScanId = NonNullable<Product['scans']>[number]['scan']
type Ctx = { payload: Payload; report: string[] }

async function bySlug(payload: Payload, slug: string) {
  const { docs } = await payload.find({
    collection: 'products',
    where: { slug: { equals: slug } },
    limit: 1,
    ...opts,
  })
  return docs[0] ?? null
}

/** Разделы передаём явно, как в других настройках: иначе правила разделов пересоберут их. */
const sections = (product: Product) => ({
  mainSection: relId(product.mainSection),
  extraSections: relIds(product.extraSections),
})

/** Подбор без метрологического набора. */
function withoutProduct(steps: Steps, id: number): Steps {
  return steps
    .map((step) => ({
      ...step,
      items: (step.items ?? []).filter((item) => relId(item.product) !== id),
    }))
    .filter((step) => step.items.length > 0)
}

async function dropMetrology({ payload, report }: Ctx) {
  const kit = await bySlug(payload, METROLOGY_SLUG)
  if (!kit) return
  const { docs } = await payload.find({
    collection: 'products',
    where: { 'picker.steps.items.product': { equals: kit.id } },
    pagination: false,
    ...opts,
  })
  for (const product of docs) {
    const steps = withoutProduct(product.picker?.steps ?? [], kit.id)
    await payload.update({
      collection: 'products',
      id: product.id,
      data: { picker: { ...product.picker, steps }, ...sections(product) },
      ...opts,
    })
    report.push(`${product.title}: метрологический набор убран из подбора`)
  }
  if (kit.status !== 'draft') {
    await payload.update({
      collection: 'products',
      id: kit.id,
      data: { status: 'draft', ...sections(kit) },
      ...opts,
    })
    report.push('Метрологический набор Artec скрыт с сайта')
  }
}

/** Подбор новой карточки: первый шаг — сам сканер, дальше — программы, как у образца. */
function pickerFor(template: Product, id: number, title: string): Product['picker'] {
  const [first, ...rest] = template.picker?.steps ?? []
  const steps: Steps = [
    {
      title: first?.title ?? 'Сканер',
      mode: 'base',
      items: [{ product: id, label: title, offers: [] }],
    },
    ...rest.map(({ id: _id, ...step }) => ({
      ...step,
      items: (step.items ?? []).map(({ id: _item, ...item }) => item),
    })),
  ]
  return { ...template.picker, steps }
}

async function createScanner(ctx: Ctx, template: Product, seed: ScannerSeed) {
  const { payload, report } = ctx
  const created = await payload.create({
    collection: 'products',
    data: {
      title: seed.title,
      slug: seed.slug,
      status: 'published',
      kind: template.kind,
      pageView: template.pageView,
      scenario: template.scenario,
      priority: template.priority,
      manufacturer: relId(template.manufacturer),
      line: relId(template.line),
      lineOrder: seed.lineOrder,
      ...sections(template),
      summary: seed.summary,
      description: seed.overview,
      properties: seed.specs.map((spec) => ({
        name: `${spec.group} — ${spec.name}`,
        value: spec.value,
      })),
      researchData: {
        category: '3d-scanners',
        filters: seed.filters,
        status: 'current',
        replacedBy: null,
      },
    },
    ...opts,
  })
  await payload.update({
    collection: 'products',
    id: created.id,
    data: { picker: pickerFor(template, created.id, seed.title), ...sections(created) },
    ...opts,
  })
  await payload.create({
    collection: 'assistant-knowledge',
    data: { product: `Каталог: ${seed.slug}`, text: seed.knowledge, active: true },
    ...opts,
  })
  report.push(`${seed.title}: карточка создана (фото — когда придёт пачка Artec)`)
  return created
}

/** Jet: показать, если скрыт; создать по текстам владельца, если товара нет. */
async function showJet(ctx: Ctx, template: Product) {
  const { payload, report } = ctx
  const jet = await bySlug(payload, JET_SLUG)
  if (jet) {
    const hidden = jet.status === 'draft' || jet.pageView === 'none'
    if (!hidden) return report.push('Artec Jet: уже на сайте')
    await payload.update({
      collection: 'products',
      id: jet.id,
      data: {
        status: 'published',
        pageView: jet.pageView === 'none' ? template.pageView : jet.pageView,
        redirectTo: null,
        ...sections(jet),
      },
      ...opts,
    })
    return report.push('Artec Jet: снова виден на сайте')
  }
  const seed = texts.find((entry) => entry.slug === JET_SLUG)
  if (!seed) return
  await createScanner(ctx, template, {
    slug: JET_SLUG,
    title: 'Artec Jet',
    lineOrder: 7,
    summary: seed.summary,
    overview: seed.overview,
    specs: seed.specs,
    filters: {
      object_size: ['XL (>200 см)', 'XXL (пространства)'],
      accuracy: '±10 мм',
      mode: 'Мобильный SLAM',
      wireless: 'Да',
      technology: 'SLAM LiDAR',
      purpose: ['Архитектура и здания', 'Контроль качества'],
    },
    knowledge: `${seed.summary} Цена — по запросу у менеджера.`,
  })
}

/** Сканы по умолчанию — только товарам, у которых список ещё пуст. */
async function fillScans({ payload, report }: Ctx) {
  const { docs } = await payload.find({
    collection: 'products',
    where: { kind: { equals: 'hardware' } },
    pagination: false,
    ...opts,
  })
  for (const product of docs) {
    const ids = defaultScanIds(product.slug)
    if (!ids.length || product.scans?.length) continue
    await payload.update({
      collection: 'products',
      id: product.id,
      data: { scans: ids.map((scan) => ({ scan: scan as ScanId })), ...sections(product) },
      ...opts,
    })
    report.push(`${product.title}: примеры сканов — ${ids.length}`)
  }
}

export async function setupArtecScanners(payload: Payload): Promise<string[] | null> {
  const done = await payload.find({
    collection: 'import-runs',
    where: { idempotencyKey: { equals: ARTEC_SCANNERS_KEY } },
    limit: 1,
    ...opts,
  })
  if (done.docs.length) return null
  const ctx: Ctx = { payload, report: [] }
  await dropMetrology(ctx)

  const template = await bySlug(payload, SCANNER_TEMPLATE)
  if (template) {
    for (const seed of NEW_SCANNERS) {
      if (await bySlug(payload, seed.slug)) {
        ctx.report.push(`${seed.title}: уже есть — не создавали`)
        continue
      }
      await createScanner(ctx, template, seed)
    }
    await showJet(ctx, template)
  } else ctx.report.push(`Нет образца ${SCANNER_TEMPLATE} — новые сканеры не созданы`)

  await fillScans(ctx)
  await payload.create({
    collection: 'import-runs',
    data: { idempotencyKey: ARTEC_SCANNERS_KEY, state: 'done', snapshot: { report: ctx.report } },
    ...opts,
  })
  return ctx.report
}
