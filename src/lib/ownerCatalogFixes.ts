import type { Payload } from 'payload'
import type { Product } from '../../payload-types'
import {
  IN_STOCK_NOTE,
  IN_STOCK_SLUGS,
  KEEP_OWN_TEXT,
  navigationRenames,
} from '../domain/ownerCatalogFixes.mjs'
import { relId, relIds } from './rel'

/**
 * Решения владельца 23.10.2026 после исследования (PR №1, Codex), разово при сборке:
 * 1) названия разделов — как до переименования `catalog-setup:navigation-v1` (Codex переименовал
 *    14 разделов без согласования) — из истории версий раздела; без версии — название из отчёта;
 * 2) у SCAD Office и AutoCAD — прежние описание, краткое описание и характеристики из истории
 *    версий товара, их сравнения для Кадди выключены;
 * 3) imagePROGRAF TZ-30000 есть в наличии — показывается в каталоге без пометки «Снят».
 */
export const OWNER_FIXES_KEY = 'catalog-setup:owner-fixes-2026-10-23'
const NAVIGATION_KEY = 'catalog-setup:navigation-v1'
const opts = { overrideAccess: true, depth: 0 } as const

async function done(payload: Payload, key: string) {
  const { docs } = await payload.find({
    collection: 'import-runs',
    where: { idempotencyKey: { equals: key } },
    limit: 1,
    ...opts,
  })
  return docs[0] ?? null
}

/** Отчёт `navigation-v1` — строки «Старое → Новое»; без запуска (новая база) — пусто. */
async function restoreSections(payload: Payload, report: string[]) {
  const run = await done(payload, NAVIGATION_KEY)
  const snapshot = run?.snapshot
  const lines =
    snapshot && typeof snapshot === 'object' && 'report' in snapshot ? snapshot.report : []
  for (const { from, to } of navigationRenames(lines)) {
    const { docs } = await payload.find({
      collection: 'sections',
      where: { title: { equals: to } },
      limit: 1,
      ...opts,
    })
    const section = docs[0]
    if (!section) {
      report.push(`Раздел «${to}» не найден — название не возвращали`)
      continue
    }
    const versions = await payload.findVersions({
      collection: 'sections',
      where: { parent: { equals: section.id } },
      sort: '-createdAt',
      pagination: false,
      depth: 0,
      overrideAccess: true,
    })
    const before = versions.docs.find((entry) => entry.version.title === from)?.version
    await payload.update({
      collection: 'sections',
      id: section.id,
      data: before ? { title: from, summary: before.summary ?? null } : { title: from },
      ...opts,
    })
    report.push(
      `Раздел: ${to} → ${from}${before ? '' : ' (пояснение плитки из истории не найдено, осталось новое)'}`,
    )
  }
}

/** Последняя версия товара до загрузки исследования: у неё ещё нет researchData. */
export async function restoreText(payload: Payload, product: Product, report: string[]) {
  const versions = await payload.findVersions({
    collection: 'products',
    where: { parent: { equals: product.id } },
    sort: '-createdAt',
    pagination: false,
    depth: 0,
    overrideAccess: true,
  })
  const before = versions.docs.find((entry) => !entry.version.researchData)?.version
  if (!before) return report.push(`${product.title}: версии до исследования нет — текст не меняли`)
  await payload.update({
    collection: 'products',
    id: product.id,
    data: {
      summary: before.summary ?? null,
      description: before.description ?? null,
      properties: (before.properties ?? []).map(({ name, value }) => ({ name, value })),
      mainSection: relId(product.mainSection),
      extraSections: relIds(product.extraSections),
    },
    ...opts,
  })
  report.push(`${product.title}: вернули прежнее описание и характеристики`)
}

export async function knowledge(payload: Payload, slug: string) {
  const { docs } = await payload.find({
    collection: 'assistant-knowledge',
    where: { product: { equals: `Каталог: ${slug}` } },
    limit: 1,
    ...opts,
  })
  return docs[0] ?? null
}

export async function setupOwnerCatalogFixes(payload: Payload): Promise<string[] | null> {
  if (await done(payload, OWNER_FIXES_KEY)) return null
  const report: string[] = []
  await restoreSections(payload, report)

  const slugs = [...KEEP_OWN_TEXT, ...IN_STOCK_SLUGS]
  const { docs: products } = await payload.find({
    collection: 'products',
    where: { slug: { in: slugs } },
    pagination: false,
    ...opts,
  })
  for (const product of products) {
    if (KEEP_OWN_TEXT.includes(product.slug)) {
      await restoreText(payload, product, report)
      const entry = await knowledge(payload, product.slug)
      if (entry) {
        await payload.update({
          collection: 'assistant-knowledge',
          id: entry.id,
          data: { active: false },
          ...opts,
        })
        report.push(`${product.title}: сравнение из исследования для Кадди выключено`)
      }
    }
    if (IN_STOCK_SLUGS.includes(product.slug)) {
      const data =
        product.researchData && typeof product.researchData === 'object' ? product.researchData : {}
      await payload.update({
        collection: 'products',
        id: product.id,
        data: {
          researchData: { ...data, status: 'in-stock', replacedBy: null },
          mainSection: relId(product.mainSection),
          extraSections: relIds(product.extraSections),
        },
        ...opts,
      })
      const entry = await knowledge(payload, product.slug)
      if (entry)
        await payload.update({
          collection: 'assistant-knowledge',
          id: entry.id,
          data: {
            text: `${String(entry.text).split('\nСнят с производства')[0]}\n${IN_STOCK_NOTE}`,
          },
          ...opts,
        })
      report.push(`${product.title}: в каталоге, без пометки «Снят с производства»`)
    }
  }
  await payload.create({
    collection: 'import-runs',
    data: { idempotencyKey: OWNER_FIXES_KEY, state: 'done', snapshot: { report } },
    ...opts,
  })
  return report
}
