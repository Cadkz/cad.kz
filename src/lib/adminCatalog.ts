import type { Payload } from 'payload'
import {
  availability,
  groupOf,
  KIND_LABELS,
  parseSort,
  type TreeGroup,
} from '@/domain/adminCatalog.mjs'
import { readResearch } from './equipmentResearch'
import type { Reply } from './priceListRun'
import { relId, relIds } from './rel'

/**
 * Данные страницы «Каталог» в админке (дерево как в Битриксе) и сохранение правок из строки:
 * «Сорт.» и «Активность» у производителя и товара. Правка — обычное сохранение записи от имени
 * человека: версия в «Истории» с откатом, «Последним правил» — он.
 */

export type TreeVendor = {
  id: number
  title: string
  published: boolean
  order: number | null
  updatedAt: string
  /** Сколько товаров производителя на каждой вкладке. */
  counts: Record<TreeGroup, number>
}

export type TreeProduct = {
  id: number
  title: string
  kind: string
  group: TreeGroup
  vendor: number | null
  line: string | null
  published: boolean
  /** «Сорт.» товара = «Порядок в линейке» (решение владельца 23.10.2026). */
  order: number | null
  /** Место в топе продаж: важнее «Сорт.» во всём каталоге. */
  top: number | null
  availability: string
  tone: 'ok' | 'muted' | 'warn'
  updatedAt: string
}

export type CatalogTreeData = { vendors: TreeVendor[]; products: TreeProduct[] }

/** Всё дерево одним запросом: ~800 товаров по нескольку коротких полей. */
export async function loadCatalogTree(payload: Payload): Promise<CatalogTreeData> {
  const opts = { pagination: false, depth: 0, overrideAccess: true } as const
  const [vendors, products, lines, offers] = await Promise.all([
    payload.find({
      collection: 'manufacturers',
      ...opts,
      select: { title: true, status: true, order: true, updatedAt: true },
    }),
    payload.find({
      collection: 'products',
      ...opts,
      select: {
        title: true,
        kind: true,
        manufacturer: true,
        line: true,
        status: true,
        lineOrder: true,
        topOrder: true,
        pageView: true,
        researchData: true,
        updatedAt: true,
      },
    }),
    payload.find({ collection: 'product-lines', ...opts, select: { title: true } }),
    payload.find({
      collection: 'offers',
      ...opts,
      where: { status: { equals: 'published' } },
      select: { product: true, amount: true },
    }),
  ])
  const lineTitle = new Map(lines.docs.map((line) => [line.id, line.title]))
  const priced = new Set(
    offers.docs.flatMap((offer) => (offer.amount ? [relId(offer.product)] : [])),
  )
  const rows: TreeProduct[] = products.docs.map((product) => {
    const shown = availability({
      research: readResearch(product.researchData)?.status ?? null,
      priced: priced.has(product.id),
      ownPage: product.pageView !== 'none',
    })
    const line = relId(product.line)
    return {
      id: product.id,
      title: product.title,
      kind: KIND_LABELS[product.kind] ?? product.kind,
      group: groupOf(product.kind),
      vendor: relId(product.manufacturer),
      line: line == null ? null : (lineTitle.get(line) ?? null),
      published: product.status === 'published',
      order: product.lineOrder ?? null,
      top: product.topOrder ?? null,
      availability: shown.label,
      tone: shown.tone,
      updatedAt: product.updatedAt,
    }
  })
  const counts = new Map<number, Record<TreeGroup, number>>()
  for (const row of rows) {
    if (row.vendor == null) continue
    const count = counts.get(row.vendor) ?? { software: 0, hardware: 0, service: 0 }
    count[row.group] += 1
    counts.set(row.vendor, count)
  }
  return {
    vendors: vendors.docs.map((vendor) => ({
      id: vendor.id,
      title: vendor.title,
      published: vendor.status === 'published',
      order: vendor.order ?? null,
      updatedAt: vendor.updatedAt,
      counts: counts.get(vendor.id) ?? { software: 0, hardware: 0, service: 0 },
    })),
    products: rows,
  }
}

type Edit = {
  collection: 'products' | 'manufacturers'
  id: number
  field: 'order' | 'published'
  value: number | boolean | null
  /** Что человек видел в строке: если запись успели поменять, правка не затирает чужую. */
  was: number | boolean | null
}

function readEdit(data: Record<string, unknown>): Edit | string {
  const { collection, id, field, value, was } = data
  if (collection !== 'products' && collection !== 'manufacturers') return 'Неизвестная запись'
  if (typeof id !== 'number' || !Number.isSafeInteger(id)) return 'Неизвестная запись'
  if (field === 'published') {
    if (typeof value !== 'boolean' || typeof was !== 'boolean') return 'Неверное значение'
    return { collection, id, field, value, was }
  }
  if (field !== 'order') return 'Неизвестное поле'
  const next = parseSort(value == null ? '' : String(value))
  const before = parseSort(was == null ? '' : String(was))
  if (!next.ok || !before.ok) return 'В «Сорт.» — целое число от 0 до 999 999 или пусто.'
  return { collection, id, field, value: next.value, was: before.value }
}

/** Поле в базе для колонки строки. */
const COLUMN = {
  products: { order: 'lineOrder', published: 'status' },
  manufacturers: { order: 'order', published: 'status' },
} as const

/**
 * Текущее значение колонки в базе. У товара — ещё его разделы: они уходят в сохранение как есть,
 * чтобы правка порядка или публикации их не трогала.
 */
async function readCurrent(payload: Payload, edit: Edit) {
  const opts = { id: edit.id, depth: 0, overrideAccess: true } as const
  if (edit.collection === 'manufacturers') {
    const doc = await payload.findByID({ collection: 'manufacturers', ...opts }).catch(() => null)
    if (!doc) return null
    const current = edit.field === 'published' ? doc.status === 'published' : (doc.order ?? null)
    return { current, keep: {} }
  }
  const doc = await payload.findByID({ collection: 'products', ...opts }).catch(() => null)
  if (!doc) return null
  const current = edit.field === 'published' ? doc.status === 'published' : (doc.lineOrder ?? null)
  const keep = { mainSection: relId(doc.mainSection), extraSections: relIds(doc.extraSections) }
  return { current, keep }
}

/**
 * Одна правка из строки дерева. Ответ — сохранённое значение и новая дата изменения, либо
 * conflict с текущим значением, если запись успели поменять.
 */
export async function saveTreeEdit(
  payload: Payload,
  data: Record<string, unknown>,
  user: { id: number | string },
): Promise<Reply> {
  const edit = readEdit(data)
  if (typeof edit === 'string') return { ok: false, status: 400, error: edit }
  const column = COLUMN[edit.collection][edit.field]
  const found = await readCurrent(payload, edit)
  if (!found) return { ok: false, status: 404, error: 'Запись не найдена: возможно, её удалили.' }
  if (found.current !== edit.was) return { ok: true, conflict: true, value: found.current }
  const value =
    edit.field === 'published' ? (edit.value === true ? 'published' : 'draft') : edit.value
  const saved = await payload.update({
    collection: edit.collection,
    id: edit.id,
    data: { [column]: value, ...found.keep },
    overrideAccess: true,
    depth: 0,
    // От имени человека: «Последним правил» и версия в истории — его.
    user: { ...user, collection: 'users' },
  })
  return { ok: true, conflict: false, value: edit.value, updatedAt: saved.updatedAt }
}
