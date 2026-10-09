import type { Payload } from 'payload'
import type { Product } from '../../payload-types'
import {
  AUTOCAD_NO_PAGE_SLUGS,
  AUTOCAD_PICKER,
  SCAD_FAMILY,
  SCAD_NO_PAGE_SLUGS,
  SCAD_NO_PAGE_TITLES,
  SCAD_OFFICE_EDITION,
  SCAD_PICKER,
  type SeedStep,
  scadEdition,
} from '../domain/pickerSeed.mjs'
import { splitTitle } from './families'
import { relId } from './rel'

/** Ключ записи в журнале «Запуски импорта»: настройка выполняется один раз. */
export const PICKER_SETUP_KEY = 'catalog-setup:picker-v1'
const opts = { overrideAccess: true, depth: 0 } as const

type Report = {
  pickers: string[]
  noPage: string[]
  families: string[]
  variants: number
  missing: string[]
}
type Brief = Pick<Product, 'id' | 'title' | 'slug' | 'line' | 'lineOrder'>
type Steps = NonNullable<NonNullable<Product['picker']>['steps']>

async function allProducts(payload: Payload): Promise<Brief[]> {
  const { docs } = await payload.find({
    collection: 'products',
    pagination: false,
    ...opts,
    select: { title: true, slug: true, line: true, lineOrder: true },
  })
  return docs
}

async function offerId(payload: Payload, productId: number, pattern: RegExp) {
  const { docs } = await payload.find({
    collection: 'offers',
    where: { product: { equals: productId } },
    pagination: false,
    ...opts,
  })
  return docs.find((offer) => pattern.test(offer.configuration))?.id ?? null
}

/** Шаги из черновика: варианты по slug, началу названия или линейке. Не найденное — в отчёт. */
async function buildSteps(
  payload: Payload,
  products: Brief[],
  steps: SeedStep[],
  lineIds: Map<string, number>,
  report: Report,
): Promise<Steps> {
  const result: Steps = []
  for (const step of steps) {
    const items: NonNullable<Steps[number]['items']> = []
    if (step.line) {
      const line = lineIds.get(step.line)
      const members = products
        .filter((p) => line != null && relId(p.line) === line)
        .sort((a, b) => (a.lineOrder ?? 99) - (b.lineOrder ?? 99) || a.title.localeCompare(b.title))
      for (const p of members) {
        const { label, note } = splitTitle(p.title)
        items.push({ product: p.id, label, note })
      }
    }
    for (const seed of step.items ?? []) {
      const product = products.find((p) =>
        seed.slug ? p.slug === seed.slug : seed.title?.test(p.title),
      )
      if (!product) {
        report.missing.push(`${step.title}: ${seed.label}`)
        continue
      }
      const offer = seed.offer ? await offerId(payload, product.id, seed.offer) : null
      if (seed.offer && !offer) report.missing.push(`${step.title}: ${seed.label} (предложение)`)
      items.push({
        product: product.id,
        offer,
        label: seed.label,
        note: seed.note ?? null,
        preselect: Boolean(seed.preselect),
      })
    }
    if (items.length)
      result.push({
        title: step.title,
        mode: step.mode,
        hint: step.hint ?? null,
        collapsed: Boolean(step.collapsed),
        items,
      })
  }
  return result
}

async function setNoPage(
  payload: Payload,
  products: Brief[],
  report: Report,
  match: (p: Brief) => boolean,
) {
  for (const p of products.filter(match)) {
    await payload.update({ collection: 'products', id: p.id, data: { pageView: 'none' }, ...opts })
    report.noPage.push(p.title)
  }
}

/** Редакция у предложений SCAD Soft по комплектации («… S392», «… SPRO»), только если пусто. */
async function scadVariants(payload: Payload, products: Brief[], report: Report) {
  const ids = products.map((p) => p.id)
  const { docs } = await payload.find({
    collection: 'offers',
    where: { product: { in: ids } },
    pagination: false,
    ...opts,
  })
  const office = products.find((p) => p.slug === SCAD_PICKER.slug)?.id
  for (const offer of docs) {
    if (offer.variants?.length) continue
    const edition =
      relId(offer.product) === office ? SCAD_OFFICE_EDITION : scadEdition(offer.configuration)
    if (!edition) continue
    await payload.update({
      collection: 'offers',
      id: offer.id,
      data: { variants: [edition] },
      ...opts,
    })
    report.variants++
  }
}

/**
 * Черновик подбора: AutoCAD и SCAD Office с подбором по шагам, пакеты и доп. функции SCAD без своих
 * страниц, сателлиты SCAD — семейство со своей страницей. Один раз (отметка в журнале).
 */
export async function setupPicker(payload: Payload): Promise<Report | null> {
  const done = await payload.find({
    collection: 'import-runs',
    where: { idempotencyKey: { equals: PICKER_SETUP_KEY } },
    limit: 1,
    ...opts,
  })
  if (done.docs.length) return null
  const report: Report = { pickers: [], noPage: [], families: [], variants: 0, missing: [] }
  const products = await allProducts(payload)
  const lineIds = new Map<string, number>()

  const vendors = await payload.find({
    collection: 'manufacturers',
    where: { title: { equals: SCAD_FAMILY.vendor } },
    limit: 1,
    ...opts,
  })
  const scad = vendors.docs[0]
  if (scad) {
    const { docs: scadProducts } = await payload.find({
      collection: 'products',
      where: { manufacturer: { equals: scad.id } },
      pagination: false,
      ...opts,
      select: { title: true, slug: true, line: true, lineOrder: true },
    })
    await scadVariants(payload, scadProducts, report)
    const lines = await payload.find({
      collection: 'product-lines',
      where: {
        and: [{ manufacturer: { equals: scad.id } }, { title: { equals: SCAD_FAMILY.line } }],
      },
      limit: 1,
      ...opts,
    })
    const line = lines.docs[0]
    if (line) {
      lineIds.set(SCAD_FAMILY.line, line.id)
      await payload.update({
        collection: 'product-lines',
        id: line.id,
        data: {
          title: SCAD_FAMILY.title,
          familyPage: true,
          slug: SCAD_FAMILY.slug,
          intro: SCAD_FAMILY.intro,
        },
        ...opts,
      })
      report.families.push(`${SCAD_FAMILY.title}: /families/${SCAD_FAMILY.slug}`)
      await setNoPage(payload, scadProducts, report, (p) => relId(p.line) === line.id)
    }
    await setNoPage(
      payload,
      scadProducts,
      report,
      (p) =>
        SCAD_NO_PAGE_SLUGS.includes(p.slug) || SCAD_NO_PAGE_TITLES.some((re) => re.test(p.title)),
    )
  }

  for (const seed of [SCAD_PICKER, AUTOCAD_PICKER]) {
    const product = products.find((p) => p.slug === seed.slug)
    if (!product) {
      report.missing.push(`товар ${seed.slug}`)
      continue
    }
    const steps = await buildSteps(payload, products, seed.steps, lineIds, report)
    await payload.update({
      collection: 'products',
      id: product.id,
      data: {
        pageView: seed.pageView,
        renewLabel: seed.renewLabel,
        tasks: seed.tasks.map((title) => ({ title })),
        ...('summary' in seed ? { summary: seed.summary } : {}),
        picker: { switches: [{ title: seed.switch.title, options: seed.switch.options }], steps },
      },
      ...opts,
    })
    report.pickers.push(product.title)
  }
  await setNoPage(payload, products, report, (p) => AUTOCAD_NO_PAGE_SLUGS.includes(p.slug))

  await payload.create({
    collection: 'import-runs',
    data: { idempotencyKey: PICKER_SETUP_KEY, state: 'done', snapshot: report },
    ...opts,
  })
  return report
}
