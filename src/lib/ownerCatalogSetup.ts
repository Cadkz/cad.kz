import type { Payload } from 'payload'
import type { Offer, Product } from '../../payload-types'
import {
  AVS_PROGRAMS,
  AVS_SECTION,
  avsOfferVariants,
  MERGE_SECTIONS,
  MOBILE_APPS,
  OWN_CARD_IMAGE,
  PROGRAM_RENAMES,
} from '../domain/ownerCatalogSeed.mjs'
import { relId, relIds } from './rel'

/** Ключ записи в журнале «Запуски импорта»: настройка выполняется один раз. */
export const OWNER_CATALOG_KEY = 'catalog-setup:owner-catalog-v1'
const opts = { overrideAccess: true, depth: 0 } as const

type Ctx = { payload: Payload; report: string[] }
type Brief = Pick<
  Product,
  | 'id'
  | 'title'
  | 'slug'
  | 'manufacturer'
  | 'mainSection'
  | 'extraSections'
  | 'gallery'
  | 'cardImage'
  | 'picker'
  | 'searchAliases'
  | 'pageView'
>

const unique = (ids: number[]) => [...new Set(ids)]

/** Разделы товара после замены from → into: основной без повторов в дополнительных. */
export function mergedSections(main: number | null, extra: number[], from: number, into: number) {
  const swap = (id: number) => (id === from ? into : id)
  const nextMain = main == null ? null : swap(main)
  const nextExtra = unique(extra.map(swap)).filter((id) => id !== nextMain)
  return { mainSection: nextMain, extraSections: nextExtra }
}

async function sectionBySlug(ctx: Ctx, slug: string) {
  const { docs } = await ctx.payload.find({
    collection: 'sections',
    where: { slug: { equals: slug } },
    limit: 1,
    ...opts,
  })
  return docs[0] ?? null
}

/** «САПР и черчение» → «Архитектура и BIM»: товары, правила, связи разделов, название. */
async function mergeSections(ctx: Ctx, products: Brief[]) {
  const { payload, report } = ctx
  const [from, into] = await Promise.all([
    sectionBySlug(ctx, MERGE_SECTIONS.from),
    sectionBySlug(ctx, MERGE_SECTIONS.into),
  ])
  if (!from || !into) return report.push('Слияние направлений: раздел не найден, пропущено')

  let moved = 0
  for (const product of products) {
    const main = relId(product.mainSection)
    const extra = relIds(product.extraSections)
    if (main !== from.id && !extra.includes(from.id)) continue
    const data = mergedSections(main, extra, from.id, into.id)
    await payload.update({ collection: 'products', id: product.id, data, ...opts })
    product.mainSection = data.mainSection
    product.extraSections = data.extraSections
    moved++
  }

  const rules = await payload.find({ collection: 'section-rules', pagination: false, ...opts })
  let ruled = 0
  for (const rule of rules.docs) {
    const main = relId(rule.mainSection)
    const extra = relIds(rule.extraSections)
    if (main !== from.id && !extra.includes(from.id)) continue
    const data = mergedSections(main, extra, from.id, into.id)
    await payload.update({ collection: 'section-rules', id: rule.id, data, ...opts })
    ruled++
  }

  const sections = await payload.find({ collection: 'sections', pagination: false, ...opts })
  for (const section of sections.docs) {
    const cross = relIds(section.crossSections)
    if (!cross.includes(from.id) || section.id === from.id) continue
    const next = unique(cross.map((id) => (id === from.id ? into.id : id))).filter(
      (id) => id !== section.id,
    )
    await payload.update({
      collection: 'sections',
      id: section.id,
      data: { crossSections: next },
      ...opts,
    })
  }

  const pins = unique([...relIds(into.pinnedManufacturers), ...relIds(from.pinnedManufacturers)])
  await payload.update({
    collection: 'sections',
    id: into.id,
    data: { title: MERGE_SECTIONS.title, pinnedManufacturers: pins },
    ...opts,
  })
  await payload.update({ collection: 'sections', id: from.id, data: { status: 'draft' }, ...opts })
  report.push(
    `«${from.title}» влито в «${MERGE_SECTIONS.title}»: товаров ${moved}, правил ${ruled}; ` +
      `«${from.title}» снято с публикации`,
  )
}

async function hide(ctx: Ctx, product: Brief, target: Brief | undefined) {
  await ctx.payload.update({
    collection: 'products',
    id: product.id,
    data: { pageView: 'none', redirectTo: target?.id ?? null },
    ...opts,
  })
  product.pageView = 'none'
}

async function mobileApps(ctx: Ctx, products: Brief[]) {
  const hidden: string[] = []
  for (const rule of MOBILE_APPS) {
    const target = products.find((p) => p.slug === rule.redirect)
    for (const product of products.filter((p) => rule.title.test(p.title))) {
      await hide(ctx, product, target)
      hidden.push(product.title)
    }
  }
  ctx.report.push(`Мобильные приложения убраны из каталога: ${hidden.join('; ') || '—'}`)
}

async function renames(ctx: Ctx, products: Brief[]) {
  const done: string[] = []
  for (const rename of PROGRAM_RENAMES) {
    const product = products.find((p) => p.slug === rename.slug)
    if (!product) {
      ctx.report.push(`Переименование: не найдено ${rename.slug}`)
      continue
    }
    // Повторный запуск: старое название уже в поиске, второй раз не дописываем.
    const aliases =
      product.title === rename.title
        ? product.searchAliases
        : [product.searchAliases, rename.aliases].filter(Boolean).join(', ')
    // Разделы передаются явно: иначе новое название пересчитало бы их по правилам.
    await ctx.payload.update({
      collection: 'products',
      id: product.id,
      data: {
        title: rename.title,
        searchAliases: aliases,
        mainSection: relId(product.mainSection),
        extraSections: relIds(product.extraSections),
      },
      ...opts,
    })
    // Подписи в подборах, где программа — вариант (AutoCAD: «AutoCAD Revit LT Suite»).
    for (const parent of products.filter((p) => p.pageView === 'picker' && p.picker?.steps)) {
      let changed = false
      const steps = (parent.picker?.steps ?? []).map((step) => ({
        ...step,
        items: (step.items ?? []).map((item) => {
          if (relId(item.product) !== product.id) return item
          changed = true
          return { ...item, label: rename.title }
        }),
      }))
      if (!changed) continue
      await ctx.payload.update({
        collection: 'products',
        id: parent.id,
        data: { picker: { ...parent.picker, steps } },
        ...opts,
      })
    }
    done.push(`${product.title} → ${rename.title}`)
  }
  if (done.length) ctx.report.push(`Переименовано: ${done.join('; ')}`)
}

/**
 * АВС: у программы выбор «Новая лицензия / Обновление», ключ (и база РСНБ у АВС-KZ). Предложения
 * обновления переезжают в программу, карточка «Обновление для …» скрывается и ведёт на программу.
 * Модули и базы из подбора АВС-KZ убраны — они отдельными карточками. Все программы — в «Сметах».
 */
async function avs(ctx: Ctx, products: Brief[]) {
  const { payload, report } = ctx
  const estimate = await sectionBySlug(ctx, AVS_SECTION)
  const offers = await payload.find({ collection: 'offers', pagination: false, ...opts })
  const offersOf = (productId: number) =>
    offers.docs.filter((offer: Offer) => relId(offer.product) === productId)
  const done: string[] = []
  for (const program of AVS_PROGRAMS) {
    const product = products.find((p) => p.slug === program.slug)
    if (!product) {
      report.push(`АВС: не найдено ${program.slug}`)
      continue
    }
    const renewal = products.find((p) => p.slug === program.renewal)
    for (const offer of offersOf(product.id)) {
      const variants = avsOfferVariants(offer.variants ?? [], offer.configuration, {
        renewal: false,
        base: Boolean(program.base),
      })
      await payload.update({ collection: 'offers', id: offer.id, data: { variants }, ...opts })
    }
    let moved = 0
    if (renewal) {
      for (const offer of offersOf(renewal.id)) {
        const variants = avsOfferVariants(offer.variants ?? [], offer.configuration, {
          renewal: true,
          base: Boolean(program.base),
        })
        await payload.update({
          collection: 'offers',
          id: offer.id,
          data: { product: product.id, variants },
          ...opts,
        })
        moved++
      }
      await hide(ctx, renewal, product)
    }
    const main = estimate?.id ?? relId(product.mainSection)
    await payload.update({
      collection: 'products',
      id: product.id,
      data: {
        pageView: 'picker',
        picker: {
          switches: program.switches,
          steps: [
            {
              title: 'Программа',
              mode: 'base',
              collapsed: false,
              items: [{ product: product.id, label: program.label, note: program.note }],
            },
          ],
        },
        // Программы АВС — только в «Сметах», без дополнительных разделов.
        mainSection: main,
        extraSections: [],
      },
      ...opts,
    })
    done.push(`${program.label}: обновлений перенесено ${moved}`)
  }
  report.push(`АВС, лицензия или обновление: ${done.join('; ') || '—'}`)
}

/** Свой значок модуля АВС на карточке: первая картинка галереи, если своей картинки нет. */
async function ownCardImages(ctx: Ctx, products: Brief[]) {
  const set: string[] = []
  for (const slug of OWN_CARD_IMAGE) {
    const product = products.find((p) => p.slug === slug)
    const image = relId(product?.gallery?.[0])
    if (!product || image == null || relId(product.cardImage) != null) continue
    await ctx.payload.update({
      collection: 'products',
      id: product.id,
      data: { cardImage: image },
      ...opts,
    })
    set.push(product.title)
  }
  ctx.report.push(`Свой значок на карточке: ${set.join('; ') || '—'}`)
}

/**
 * Каталог по замечаниям владельца 22.10.2026. Один раз (отметка в журнале). null — уже сделано.
 */
export async function setupOwnerCatalog(payload: Payload): Promise<string[] | null> {
  const done = await payload.find({
    collection: 'import-runs',
    where: { idempotencyKey: { equals: OWNER_CATALOG_KEY } },
    limit: 1,
    ...opts,
  })
  if (done.docs.length) return null

  const ctx: Ctx = { payload, report: [] }
  const { docs } = await payload.find({ collection: 'products', pagination: false, ...opts })
  const products: Brief[] = docs
  await mergeSections(ctx, products)
  await mobileApps(ctx, products)
  await renames(ctx, products)
  await avs(ctx, products)
  await ownCardImages(ctx, products)

  await payload.create({
    collection: 'import-runs',
    data: { idempotencyKey: OWNER_CATALOG_KEY, state: 'done', snapshot: { report: ctx.report } },
    ...opts,
  })
  return ctx.report
}
