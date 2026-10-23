import type { Payload } from 'payload'
import {
  NEW_PLOTTERS,
  OLD_SITE_TEXT,
  RENAMES_V2,
  RESTORE_TEXT_V2,
} from '../domain/ownerCatalogFixes2.mjs'
import { knowledge, restoreText } from './ownerCatalogFixes'
import { relId, relIds } from './rel'

/**
 * Решения владельца 23.10.2026, вторая часть, разово при сборке:
 * 1) у 9 программ из исследования — прежние описание, краткое описание и характеристики из
 *    истории версий, их сравнения для Кадди выключены (как у SCAD и AutoCAD);
 * 2) две ошибки в названиях: артикул в жёлтом тонере, «plotWAVE T30/35» → «T30/T35»;
 * 3) новые Canon imagePROGRAF TX-3300 и TX-4300 (поставки в регионе с ноября 2026) —
 *    отдельные карточки рядом с TX-3200 / TX-4200, которые ещё продаются.
 */
export const OWNER_FIXES_2_KEY = 'catalog-setup:owner-fixes-2-2026-10-23'
const opts = { overrideAccess: true, depth: 0 } as const

async function bySlug(payload: Payload, slugs: string[]) {
  const { docs } = await payload.find({
    collection: 'products',
    where: { slug: { in: slugs } },
    pagination: false,
    ...opts,
  })
  return docs
}

async function addPlotters(payload: Payload, report: string[]) {
  const products = await bySlug(payload, [
    ...NEW_PLOTTERS.map((entry) => entry.slug),
    ...NEW_PLOTTERS.map((entry) => entry.copyFrom),
  ])
  let missing = 0
  for (const seed of NEW_PLOTTERS) {
    if (products.some((entry) => entry.slug === seed.slug)) {
      report.push(`${seed.title}: уже есть — не создавали`)
      continue
    }
    const source = products.find((entry) => entry.slug === seed.copyFrom)
    if (!source) {
      missing++
      report.push(
        `${seed.title}: нет предыдущей модели ${seed.copyFrom} — создадим при следующей сборке`,
      )
      continue
    }
    await payload.create({
      collection: 'products',
      data: {
        title: seed.title,
        slug: seed.slug,
        status: 'published',
        kind: source.kind,
        pageView: source.pageView,
        scenario: source.scenario,
        priority: source.priority,
        manufacturer: relId(source.manufacturer),
        line: relId(source.line),
        lineOrder: source.lineOrder,
        mainSection: relId(source.mainSection),
        extraSections: relIds(source.extraSections),
        // Фото — предыдущей модели той же серии, пока владелец не загрузит новое.
        cardImage: relId(source.cardImage),
        gallery: relIds(source.gallery),
        summary: seed.summary,
        description: seed.description,
        properties: seed.properties,
        researchData: {
          category: 'plotters',
          filters: seed.filters,
          status: 'current',
          replacedBy: null,
        },
      },
      ...opts,
    })
    await payload.create({
      collection: 'assistant-knowledge',
      data: { product: `Каталог: ${seed.slug}`, text: seed.knowledge, active: true },
      ...opts,
    })
    report.push(`${seed.title}: создан, фото временно от ${source.title}`)
  }
  return missing
}

export async function setupOwnerCatalogFixes2(payload: Payload): Promise<string[] | null> {
  const done = await payload.find({
    collection: 'import-runs',
    where: { idempotencyKey: { equals: OWNER_FIXES_2_KEY } },
    limit: 1,
    ...opts,
  })
  if (done.docs.length) return null
  const report: string[] = []

  for (const product of await bySlug(payload, RESTORE_TEXT_V2)) {
    // Без версии исследования (новая база) текст и так прежний.
    if (!product.researchData) continue
    await restoreText(payload, product, report)
    const entry = await knowledge(payload, product.slug)
    if (entry?.active) {
      await payload.update({
        collection: 'assistant-knowledge',
        id: entry.id,
        data: { active: false },
        ...opts,
      })
      report.push(`${product.title}: сравнение из исследования для Кадди выключено`)
    }
  }

  for (const product of await bySlug(payload, Object.keys(RENAMES_V2))) {
    const title = RENAMES_V2[product.slug as keyof typeof RENAMES_V2]
    if (product.title === title) continue
    await payload.update({
      collection: 'products',
      id: product.id,
      data: {
        title,
        mainSection: relId(product.mainSection),
        extraSections: relIds(product.extraSections),
      },
      ...opts,
    })
    report.push(`Название: ${product.title} → ${title}`)
  }

  if (await addPlotters(payload, report)) return report
  await payload.create({
    collection: 'import-runs',
    data: { idempotencyKey: OWNER_FIXES_2_KEY, state: 'done', snapshot: { report } },
    ...opts,
  })
  return report
}

/**
 * Догон к части 2: у AEC Collection в истории не осталось сохранения до исследования, текст
 * берём со старого cad.kz. Пишем, только если описание всё ещё из исследования (в товаре есть
 * researchData, а правил его не человек).
 */
export const OWNER_FIXES_3_KEY = 'catalog-setup:owner-fixes-3-2026-10-23'

export async function setupOwnerCatalogFixes3(payload: Payload): Promise<string[] | null> {
  const done = await payload.find({
    collection: 'import-runs',
    where: { idempotencyKey: { equals: OWNER_FIXES_3_KEY } },
    limit: 1,
    ...opts,
  })
  if (done.docs.length) return null
  const report: string[] = []
  for (const product of await bySlug(payload, Object.keys(OLD_SITE_TEXT))) {
    const text = OLD_SITE_TEXT[product.slug]
    if (!text || !product.researchData || product.updatedBy) continue
    await payload.update({
      collection: 'products',
      id: product.id,
      data: {
        summary: text.summary,
        description: text.description,
        mainSection: relId(product.mainSection),
        extraSections: relIds(product.extraSections),
      },
      ...opts,
    })
    report.push(`${product.title}: текст со старого cad.kz`)
  }
  await payload.create({
    collection: 'import-runs',
    data: { idempotencyKey: OWNER_FIXES_3_KEY, state: 'done', snapshot: { report } },
    ...opts,
  })
  return report
}
