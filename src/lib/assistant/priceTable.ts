import type { Payload } from 'payload'
import {
  indexPriceRows,
  type KnowledgeEntry,
  type PriceIndex,
  type PriceRow,
  type VatMode,
} from '@/domain/priceTable.mjs'

/**
 * Прайс и база знаний Кадди в базе сайта: загрузка со страницы «Прайс и база Кадди», чтение для
 * инструментов модели. Прайс хранится одним снимком (коллекция price-tables), в памяти сервера
 * держится вместе с поисковым индексом, пока в базе не появится новый.
 */

export type PriceSummary = {
  fileName: string
  /** Дата прайса — самая поздняя «Дата обновления» в строках, ГГГГ-ММ-ДД. */
  updated: string
  vat: VatMode
  rows: number
  uploadedAt: string
  uploadedBy: string
}

export type LoadedPriceTable = {
  id: number
  summary: PriceSummary
  rows: PriceRow[]
  index: PriceIndex
}

const options = { overrideAccess: true } as const
const KEEP_OLD = 2

const memory = globalThis as {
  __kaddiPrice?: { id: number; updatedAt: string; table: LoadedPriceTable }
}

function isSummary(value: unknown): value is PriceSummary {
  return (
    Boolean(value) && typeof value === 'object' && typeof (value as PriceSummary).rows === 'number'
  )
}

/** Действующий прайс без строк — для страницы админки и правил модели. */
export async function priceSummary(payload: Payload): Promise<PriceSummary | null> {
  const { docs } = await payload.find({
    collection: 'price-tables',
    where: { state: { equals: 'active' } },
    sort: '-createdAt',
    limit: 1,
    depth: 0,
    select: { summary: true },
    ...options,
  })
  const summary = docs[0]?.summary
  return isSummary(summary) ? summary : null
}

/** Действующий прайс со строками и индексом. Нет прайса — null (цены уточняет менеджер). */
export async function loadPriceTable(payload: Payload): Promise<LoadedPriceTable | null> {
  const { docs } = await payload.find({
    collection: 'price-tables',
    where: { state: { equals: 'active' } },
    sort: '-createdAt',
    limit: 1,
    depth: 0,
    select: { updatedAt: true },
    ...options,
  })
  const head = docs[0]
  if (!head) return null
  const cached = memory.__kaddiPrice
  if (cached && cached.id === head.id && cached.updatedAt === head.updatedAt) return cached.table
  const doc = await payload.findByID({
    collection: 'price-tables',
    id: head.id,
    depth: 0,
    ...options,
  })
  const snapshot = doc.snapshot as { rows?: unknown } | null
  if (!isSummary(doc.summary) || !Array.isArray(snapshot?.rows)) return null
  const rows = snapshot.rows as PriceRow[]
  const table = { id: doc.id, summary: doc.summary, rows, index: indexPriceRows(rows) }
  memory.__kaddiPrice = { id: doc.id, updatedAt: doc.updatedAt, table }
  return table
}

/**
 * Новый прайс становится действующим, прежний — историей (хранятся два последних).
 * Строки уже проверены (validatePriceRows).
 */
export async function savePriceTable(
  payload: Payload,
  rows: PriceRow[],
  meta: Omit<PriceSummary, 'rows' | 'uploadedAt'>,
): Promise<PriceSummary> {
  const summary: PriceSummary = { ...meta, rows: rows.length, uploadedAt: new Date().toISOString() }
  const created = await payload.create({
    collection: 'price-tables',
    data: { state: 'active', summary, snapshot: { version: 1, rows } },
    ...options,
  })
  await payload.update({
    collection: 'price-tables',
    where: { and: [{ state: { equals: 'active' } }, { id: { not_equals: created.id } }] },
    data: { state: 'old' },
    ...options,
  })
  const { docs: old } = await payload.find({
    collection: 'price-tables',
    where: { state: { equals: 'old' } },
    sort: '-createdAt',
    limit: 50,
    depth: 0,
    select: { state: true },
    ...options,
  })
  for (const doc of old.slice(KEEP_OLD))
    await payload.delete({ collection: 'price-tables', id: doc.id, ...options })
  return summary
}

/** Сколько записей в базе знаний и сколько из них включено. */
export async function knowledgeCount(payload: Payload) {
  const [all, active] = await Promise.all([
    payload.count({ collection: 'assistant-knowledge', ...options }),
    payload.count({
      collection: 'assistant-knowledge',
      where: { active: { equals: true } },
      ...options,
    }),
  ])
  return { all: all.totalDocs, active: active.totalDocs }
}

/** Включённые записи базы знаний по порядку — в правила модели. */
export async function loadKnowledge(payload: Payload): Promise<KnowledgeEntry[]> {
  const { docs } = await payload.find({
    collection: 'assistant-knowledge',
    where: { active: { equals: true } },
    sort: 'position',
    limit: 500,
    depth: 0,
    select: { product: true, text: true },
    ...options,
  })
  return docs.map((doc) => ({ product: doc.product || 'Все', text: doc.text }))
}

/** База знаний заменяется целиком записями из файла (ручные правки прежних записей пропадают). */
export async function replaceKnowledge(payload: Payload, entries: KnowledgeEntry[]) {
  await payload.delete({
    collection: 'assistant-knowledge',
    where: { id: { exists: true } },
    ...options,
  })
  let position = 0
  for (const entry of entries) {
    position += 10
    await payload.create({
      collection: 'assistant-knowledge',
      data: { text: entry.text, product: entry.product, active: true, position },
      ...options,
    })
  }
  return entries.length
}
