import type { Payload } from 'payload'
import type { Offer, Product } from '../../payload-types'
import {
  ARTEC_SCANNERS,
  AVS_PICKER,
  AVS_VARIANT_SLUGS,
  artecPicker,
  avsVariants,
  DRAFT_SLUGS,
  GEO5_NO_PAGE,
  LIRA_FAMILIES,
  LIRA_NO_PAGE_SLUGS,
  PICKERS2,
  type Picker2,
  RENAMES,
} from '../domain/pickerSeed2.mjs'
import { splitTitle } from './families'
import { relId } from './rel'

/** Ключ записи в журнале «Запуски импорта»: настройка выполняется один раз. */
export const PICKER_SETUP_V4_KEY = 'catalog-setup:picker-v4'
const opts = { overrideAccess: true, depth: 0 } as const

type Brief = Pick<Product, 'id' | 'title' | 'slug' | 'manufacturer' | 'line' | 'pageView'>
type Steps = NonNullable<NonNullable<Product['picker']>['steps']>
type Report = { done: string[]; missing: string[] }
type Ctx = {
  payload: Payload
  products: Brief[]
  vendorId: Map<string, number>
  offers: Map<number, Offer[]>
  report: Report
}

/** Товары производителя по образцу названия (без исключений). */
function picked(ctx: Ctx, pick: { vendor: string; title: RegExp; except?: string[] }) {
  const vendor = ctx.vendorId.get(pick.vendor)
  return ctx.products
    .filter(
      (p) =>
        vendor != null &&
        relId(p.manufacturer) === vendor &&
        pick.title.test(p.title) &&
        !(pick.except ?? []).includes(p.slug),
    )
    .sort((a, b) => a.title.localeCompare(b.title, 'ru'))
}

function buildSteps(ctx: Ctx, seed: Picker2): Steps {
  const steps: Steps = []
  for (const step of seed.steps) {
    const items: NonNullable<Steps[number]['items']> = []
    if (step.pick) {
      const { strip } = step.pick
      for (const p of picked(ctx, step.pick)) {
        const { label, note } = splitTitle(strip ? p.title.replace(strip, '') : p.title)
        items.push({ product: p.id, label, note })
      }
    }
    for (const item of step.items ?? []) {
      const product = ctx.products.find((p) => p.slug === item.slug)
      if (!product) {
        ctx.report.missing.push(`${seed.slug} → ${step.title}: ${item.label}`)
        continue
      }
      const offers = item.offer
        ? (ctx.offers.get(product.id) ?? [])
            .filter((o) => item.offer?.test(o.configuration.trim()))
            .map((o) => o.id)
        : []
      if (item.offer && !offers.length) {
        ctx.report.missing.push(`${seed.slug} → ${item.label}: нет предложения`)
        continue
      }
      items.push({
        product: product.id,
        offers,
        label: item.label,
        note: item.note ?? null,
        preselect: Boolean(item.preselect),
      })
    }
    if (items.length)
      steps.push({
        title: step.title,
        mode: step.mode,
        hint: step.hint ?? null,
        collapsed: Boolean(step.collapsed),
        items,
      })
  }
  return steps
}

/** Подбор товара. Уже настроенный в админке подбор (вид «с подбором») не трогаем. */
async function applyPicker(ctx: Ctx, seed: Picker2) {
  const product = ctx.products.find((p) => p.slug === seed.slug)
  if (!product) return ctx.report.missing.push(`товар ${seed.slug}`)
  if (product.pageView === 'picker') return ctx.report.done.push(`${product.title}: уже с подбором`)
  const steps = buildSteps(ctx, seed)
  await ctx.payload.update({
    collection: 'products',
    id: product.id,
    data: {
      pageView: 'picker',
      ...(seed.title ? { title: seed.title } : {}),
      ...(seed.renewLabel ? { renewLabel: seed.renewLabel } : {}),
      ...(seed.tasks ? { tasks: seed.tasks.map((title) => ({ title })) } : {}),
      picker: { switches: seed.switches ?? [], steps },
    },
    ...opts,
  })
  ctx.report.done.push(`подбор: ${seed.title ?? product.title}`)
}

async function update(ctx: Ctx, ids: number[], data: Partial<Product>, label: string) {
  for (const id of ids) {
    await ctx.payload.update({ collection: 'products', id, data, ...opts })
  }
  if (ids.length) ctx.report.done.push(`${label}: ${ids.length}`)
}

/**
 * Подбор GEO5, Revit, ЛИРА-FEM, АВС и сканеров Artec; модули GEO5 и ЛИРА без своих страниц
 * (старый адрес открывает подбор с модулем); семейства САПФИР, МОНОМАХ-САПР, ЭСПРИ; значения
 * переключателей у предложений АВС. Один раз (отметка в журнале).
 */
export async function setupPickerV4(payload: Payload): Promise<Report | null> {
  const done = await payload.find({
    collection: 'import-runs',
    where: { idempotencyKey: { equals: PICKER_SETUP_V4_KEY } },
    limit: 1,
    ...opts,
  })
  if (done.docs.length) return null
  const [products, vendors, offers] = await Promise.all([
    payload.find({
      collection: 'products',
      pagination: false,
      select: { title: true, slug: true, manufacturer: true, line: true, pageView: true },
      ...opts,
    }),
    payload.find({ collection: 'manufacturers', pagination: false, ...opts }),
    payload.find({ collection: 'offers', pagination: false, ...opts }),
  ])
  const byProduct = new Map<number, Offer[]>()
  for (const offer of offers.docs) {
    const id = relId(offer.product)
    if (id != null) byProduct.set(id, [...(byProduct.get(id) ?? []), offer])
  }
  const ctx: Ctx = {
    payload,
    products: products.docs,
    vendorId: new Map(vendors.docs.map((v) => [v.title, v.id])),
    offers: byProduct,
    report: { done: [], missing: [] },
  }
  const ids = (slugs: string[]) =>
    ctx.products.filter((p) => slugs.includes(p.slug)).map((p) => p.id)

  // Значения переключателей АВС — до сборки подбора; уже заполненные не трогаем.
  const avs4 = ids([AVS_PICKER.slug])
  for (const id of ids(AVS_VARIANT_SLUGS))
    for (const offer of byProduct.get(id) ?? []) {
      const variants = avsVariants(offer.configuration, avs4.includes(id))
      if (offer.variants?.length || !variants.length) continue
      await payload.update({ collection: 'offers', id: offer.id, data: { variants }, ...opts })
    }

  for (const rename of RENAMES)
    await update(
      ctx,
      ids([rename.slug]),
      { title: rename.title },
      `переименовано в ${rename.title}`,
    )

  for (const seed of PICKERS2) await applyPicker(ctx, seed)
  for (const slug of ARTEC_SCANNERS) {
    const product = ctx.products.find((p) => p.slug === slug)
    if (product) await applyPicker(ctx, artecPicker(slug, product.title))
    else ctx.report.missing.push(`сканер ${slug}`)
  }

  await update(
    ctx,
    picked(ctx, GEO5_NO_PAGE).map((p) => p.id),
    { pageView: 'none' },
    'модули GEO5 без своей страницы',
  )
  await update(ctx, ids(LIRA_NO_PAGE_SLUGS), { pageView: 'none' }, 'модули ЛИРА без своей страницы')
  await update(ctx, ids(DRAFT_SLUGS), { status: 'draft' }, 'в черновики')

  for (const family of LIRA_FAMILIES) {
    const vendor = ctx.vendorId.get(family.vendor)
    const { docs } = await payload.find({
      collection: 'product-lines',
      where: { and: [{ manufacturer: { equals: vendor } }, { title: { equals: family.line } }] },
      limit: 1,
      ...opts,
    })
    const line = docs[0]
    if (!line || vendor == null) {
      ctx.report.missing.push(`линейка ${family.vendor}: ${family.line}`)
      continue
    }
    await payload.update({
      collection: 'product-lines',
      id: line.id,
      data: { title: family.title, familyPage: true, slug: family.slug, intro: family.intro },
      ...opts,
    })
    const members = ctx.products.filter((p) => relId(p.line) === line.id).map((p) => p.id)
    await update(ctx, members, { pageView: 'none' }, `семейство /families/${family.slug}`)
  }

  await payload.create({
    collection: 'import-runs',
    data: { idempotencyKey: PICKER_SETUP_V4_KEY, state: 'done', snapshot: ctx.report },
    ...opts,
  })
  return ctx.report
}
