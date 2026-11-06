import type { Payload } from 'payload'
import { type DocUpdate, planUpdates, tableGroups } from '@/domain/translationTable.mjs'

/**
 * Таблица переводов товаров и разделов (страница админки «Переводы»): тексты из базы со всеми
 * языками сразу (locale: 'all') и запись загруженных переводов. Чистая логика —
 * src/domain/translationTable.mjs.
 */

type Doc = Record<string, unknown> & { id: number }

const PRODUCT_SELECT = {
  title: true,
  summary: true,
  description: true,
  tasks: true,
  faq: true,
  seo: true,
} as const

/** Опубликованные разделы и товары по порядку каталога. Черновики не переводим. */
async function loadDocs(payload: Payload) {
  const query = {
    locale: 'all',
    depth: 0,
    pagination: false,
    overrideAccess: true,
    where: { status: { equals: 'published' } },
  } as const
  const [sections, products] = await Promise.all([
    payload.find({
      ...query,
      collection: 'sections',
      select: { title: true, summary: true },
      sort: 'id',
    }),
    payload.find({ ...query, collection: 'products', select: PRODUCT_SELECT, sort: 'id' }),
  ])
  return {
    sections: sections.docs as unknown as Doc[],
    products: products.docs as unknown as Doc[],
  }
}

export async function translationGroups(payload: Payload) {
  return tableGroups(await loadDocs(payload))
}

/** Документы по ключам загруженной таблицы: только те, что в ней упомянуты. */
async function docsByKeys(payload: Payload, keys: string[]) {
  const ids = { products: new Set<number>(), sections: new Set<number>() }
  for (const key of keys) {
    const [collection, id] = key.split(':')
    if (collection === 'products' || collection === 'sections') ids[collection].add(Number(id))
  }
  const found = new Map<string, Doc>()
  for (const collection of ['products', 'sections'] as const) {
    if (!ids[collection].size) continue
    const result = await payload.find({
      collection,
      locale: 'all',
      depth: 0,
      pagination: false,
      overrideAccess: true,
      where: { id: { in: [...ids[collection]] } },
      select: collection === 'products' ? PRODUCT_SELECT : { title: true, summary: true },
    })
    for (const doc of result.docs as unknown as Doc[]) found.set(`${collection}:${doc.id}`, doc)
  }
  return found
}

/** Разбор загруженных строк: что и куда запишется, и что пропущено с причиной. */
export async function planTranslations(
  payload: Payload,
  rows: { key: string; kk: string; en: string }[],
) {
  const docs = await docsByKeys(
    payload,
    rows.map((row) => row.key),
  )
  return planUpdates(rows, (collection, id) => docs.get(`${collection}:${id}`))
}

/**
 * Запись переводов одного документа: по одному сохранению на язык, по очереди (сохранение товара
 * запускает хуки заполненности и кэша, параллельно на Vercel они зависали — 31.10.2026).
 */
export async function saveTranslation(payload: Payload, update: DocUpdate) {
  for (const lang of ['kk', 'en'] as const) {
    const data = update.data[lang]
    if (!Object.keys(data).length) continue
    await payload.update({
      collection: update.collection,
      id: update.id,
      locale: lang,
      data,
      depth: 0,
      overrideAccess: true,
    })
  }
}
