import type { Payload } from 'payload'
import { seedTopic, TOPICS } from '../domain/topicSeed.mjs'
import {
  APP_TITLE,
  LINE_SEED,
  SECTION_PINS,
  seedLine,
  VENDOR_LEVELS,
  VENDOR_MERGES,
} from '../domain/vendorsSeed.mjs'
import { relId } from './rel'

/** Ключ записи в журнале «Запуски импорта»: настройка выполняется один раз. */
export const VENDORS_SETUP_KEY = 'catalog-setup:vendors-v2'
const opts = { overrideAccess: true, depth: 0 } as const

type Report = {
  merged: string[]
  vendorLevels: string[]
  apps: string[]
  sections: string[]
  lines: string[]
  lineProducts: number
  topics: Record<string, number>
}

/** Дубли производителей: всё переносится к записи с бо́льшим числом товаров, лишняя удаляется. */
async function mergeVendors(payload: Payload, report: Report) {
  for (const merge of VENDOR_MERGES) {
    const found = await payload.find({
      collection: 'manufacturers',
      where: { title: { in: merge.titles } },
      pagination: false,
      ...opts,
    })
    if (!found.docs.length) continue
    const counted = []
    for (const doc of found.docs) {
      const { totalDocs } = await payload.count({
        collection: 'products',
        where: { manufacturer: { equals: doc.id } },
        overrideAccess: true,
      })
      counted.push({ doc, products: totalDocs })
    }
    counted.sort((a, b) => b.products - a.products || Number(b.doc.title === merge.keep) - 1)
    const keeper = counted[0].doc
    for (const { doc } of counted.slice(1)) {
      const moved = { manufacturer: { equals: doc.id } }
      await payload.update({
        collection: 'products',
        where: moved,
        data: { manufacturer: keeper.id },
        ...opts,
      })
      await payload.update({
        collection: 'section-rules',
        where: moved,
        data: { manufacturer: keeper.id },
        ...opts,
      })
      await payload.update({
        collection: 'product-lines',
        where: moved,
        data: { manufacturer: keeper.id },
        ...opts,
      })
      const sections = await payload.find({
        collection: 'sections',
        where: { pinnedManufacturers: { contains: doc.id } },
        pagination: false,
        ...opts,
      })
      for (const section of sections.docs) {
        const pins = (section.pinnedManufacturers ?? []).map((m) => relId(m) ?? 0)
        const next = [...new Set(pins.map((id) => (id === doc.id ? keeper.id : id)))]
        await payload.update({
          collection: 'sections',
          id: section.id,
          data: { pinnedManufacturers: next },
          ...opts,
        })
      }
      await payload.delete({ collection: 'manufacturers', id: doc.id, ...opts })
    }
    if (keeper.title !== merge.keep || counted.length > 1)
      await payload.update({
        collection: 'manufacturers',
        id: keeper.id,
        data: { title: merge.keep },
        ...opts,
      })
    report.merged.push(`${counted.map((c) => c.doc.title).join(' + ')} → ${merge.keep}`)
  }
}

async function vendorIds(payload: Payload) {
  const vendors = await payload.find({ collection: 'manufacturers', pagination: false, ...opts })
  return new Map(vendors.docs.map((m) => [m.title, m.id]))
}

/** Линейки SCAD Soft и ЛИРА-FEM и товары в них (только товары без линейки). */
async function seedLines(payload: Payload, vendors: Map<string, number>, report: Report) {
  for (const seed of LINE_SEED) {
    const vendor = vendors.get(seed.vendor)
    if (!vendor) continue
    const lineIds = new Map<string, number>()
    for (const line of seed.lines) {
      const existing = await payload.find({
        collection: 'product-lines',
        where: { and: [{ manufacturer: { equals: vendor } }, { title: { equals: line.title } }] },
        limit: 1,
        ...opts,
      })
      const doc =
        existing.docs[0] ??
        (await payload.create({
          collection: 'product-lines',
          data: { title: line.title, status: 'published', manufacturer: vendor, order: line.order },
          ...opts,
        }))
      lineIds.set(line.title, doc.id)
      report.lines.push(`${seed.vendor}: ${line.title}`)
    }
    const products = await payload.find({
      collection: 'products',
      where: { manufacturer: { equals: vendor } },
      pagination: false,
      ...opts,
      select: { title: true, line: true },
    })
    for (const product of products.docs) {
      if (product.line) continue
      const match = seedLine(seed.vendor, product.title)
      const line = match && lineIds.get(match.line)
      if (!match || !line) continue
      await payload.update({
        collection: 'products',
        id: product.id,
        data: { line, lineOrder: match.order },
        ...opts,
      })
      report.lineProducts++
    }
  }
}

/** Темы новостей и статей и первая раскладка публикаций без темы. */
async function seedTopics(payload: Payload, report: Report) {
  const ids = new Map<string, number>()
  for (const [index, topic] of TOPICS.entries()) {
    const existing = await payload.find({
      collection: 'topics',
      where: { slug: { equals: topic.slug } },
      limit: 1,
      ...opts,
    })
    const doc =
      existing.docs[0] ??
      (await payload.create({
        collection: 'topics',
        data: { ...topic, status: 'published', order: (index + 1) * 10 },
        ...opts,
      }))
    ids.set(topic.slug, doc.id)
  }
  const publications = await payload.find({
    collection: 'publications',
    where: { and: [{ kind: { in: ['news', 'article'] } }, { theme: { exists: false } }] },
    pagination: false,
    ...opts,
    select: { title: true, excerpt: true, kind: true },
  })
  const bySlug = new Map<string, number[]>()
  for (const doc of publications.docs) {
    const slug = seedTopic({ kind: doc.kind, title: doc.title, excerpt: doc.excerpt })
    bySlug.set(slug, [...(bySlug.get(slug) ?? []), doc.id])
  }
  for (const [slug, list] of bySlug) {
    const theme = ids.get(slug)
    if (!theme) continue
    // Пачками: одно обновление на тему, а не на каждую из ~1100 публикаций по отдельности.
    for (let i = 0; i < list.length; i += 200)
      await payload.update({
        collection: 'publications',
        where: { id: { in: list.slice(i, i + 200) } },
        data: { theme },
        ...opts,
      })
    report.topics[slug] = list.length
  }
}

/**
 * Вторая настройка каталога после демо: дубли производителей, CSoft в топ, приложения в конец,
 * порядок производителей в разделах, первые линейки, темы новостей. Один раз (отметка в журнале),
 * дальше всё правится в админке.
 */
export async function setupVendors(payload: Payload): Promise<Report | null> {
  const done = await payload.find({
    collection: 'import-runs',
    where: { idempotencyKey: { equals: VENDORS_SETUP_KEY } },
    limit: 1,
    ...opts,
  })
  if (done.docs.length) return null
  const report: Report = {
    merged: [],
    vendorLevels: [],
    apps: [],
    sections: [],
    lines: [],
    lineProducts: 0,
    topics: {},
  }

  await mergeVendors(payload, report)
  const vendors = await vendorIds(payload)

  for (const [title, level] of Object.entries(VENDOR_LEVELS)) {
    const id = vendors.get(title)
    if (!id) continue
    await payload.update({
      collection: 'manufacturers',
      id,
      data: { priority: level as 'top' },
      ...opts,
    })
    report.vendorLevels.push(title)
  }

  const products = await payload.find({
    collection: 'products',
    pagination: false,
    ...opts,
    select: { title: true },
  })
  for (const product of products.docs) {
    if (!APP_TITLE.test(product.title)) continue
    await payload.update({
      collection: 'products',
      id: product.id,
      data: { priority: 'low' },
      ...opts,
    })
    report.apps.push(product.title)
  }

  for (const [slug, titles] of Object.entries(SECTION_PINS)) {
    const found = await payload.find({
      collection: 'sections',
      where: { slug: { equals: slug } },
      limit: 1,
      ...opts,
    })
    const section = found.docs[0]
    const ids = titles.map((title) => vendors.get(title)).filter((id): id is number => !!id)
    if (!section || !ids.length) continue
    await payload.update({
      collection: 'sections',
      id: section.id,
      data: { pinnedManufacturers: ids },
      ...opts,
    })
    report.sections.push(section.title)
  }

  await seedLines(payload, vendors, report)
  await seedTopics(payload, report)

  await payload.create({
    collection: 'import-runs',
    data: { idempotencyKey: VENDORS_SETUP_KEY, state: 'done', snapshot: report },
    ...opts,
  })
  return report
}
