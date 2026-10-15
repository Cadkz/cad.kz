import { type PostgresAdapter, sql } from '@payloadcms/db-postgres'
import type { Payload, PayloadRequest, Where } from 'payload'
import type { Product } from '../../payload-types'
import { resolveScenario } from '../domain/buyScenario.mjs'
import { type Check, productQuality } from '../domain/quality.mjs'
import { loadPricingContext, type PricingContext, quoteOffer } from './pricing'
import { relId, relIds } from './rel'

/**
 * Отметка заполненности у товаров: «Заполненность» (процент) и «Чего не хватает» (список) хранятся
 * в самом товаре, чтобы по ним можно было сортировать и фильтровать список в админке и сохранять
 * готовые виды. Пересчёт: при сохранении товара (хук productQuality), при сохранении и удалении
 * предложения (хук offerQuality) и всех сразу — при открытии «Контроля качества».
 */

type Counts = { all: number; priced: number }
type QualityFields = Pick<Product, 'qualityScore' | 'qualityGaps'>
export type ProductQuality = { gaps: Check[]; score: number }

/** Поля товара, от которых зависит заполненность. */
type QualitySource = Partial<
  Pick<
    Product,
    'kind' | 'scenario' | 'mainSection' | 'extraSections' | 'gallery' | 'description' | 'summary'
  >
>

export const QUALITY_SELECT = {
  kind: true,
  scenario: true,
  mainSection: true,
  extraSections: true,
  gallery: true,
  description: true,
  summary: true,
} as const

const OPTS = { overrideAccess: true, depth: 0, pagination: false } as const

/** Цены считаются один раз на запрос: при загрузке прайса предложений сотни. */
const CONTEXT_KEY = 'qualityPricing'

async function pricing(payload: Payload, req?: PayloadRequest): Promise<PricingContext> {
  const cached = req?.context[CONTEXT_KEY] as PricingContext | undefined
  if (cached) return cached
  const context = await loadPricingContext(payload)
  if (req) req.context[CONTEXT_KEY] = context
  return context
}

/** Сколько у товаров опубликованных предложений и сколько из них с ценой больше нуля. */
async function offerCounts(
  payload: Payload,
  productIds: number[] | null,
  req?: PayloadRequest,
): Promise<Map<number, Counts>> {
  const where: Where =
    productIds === null
      ? { status: { equals: 'published' } }
      : { and: [{ status: { equals: 'published' } }, { product: { in: productIds } }] }
  // Запросы по очереди: внутри транзакции у запроса одно подключение к базе.
  const offers = await payload.find({
    collection: 'offers',
    where,
    select: { product: true, amount: true, currency: true, includesVat: true, sourceVat: true },
    req,
    ...OPTS,
  })
  const context = await pricing(payload, req)
  const counts = new Map<number, Counts>()
  for (const offer of offers.docs) {
    const productId = relId(offer.product)
    if (productId == null) continue
    const count = counts.get(productId) ?? { all: 0, priced: 0 }
    count.all++
    try {
      if (BigInt(quoteOffer(offer, context).unitKzt) > 0n) count.priced++
    } catch {
      // Цена не считается (нет курса, «по запросу») — значит, цены нет.
    }
    counts.set(productId, count)
  }
  return counts
}

async function sectionScenarios(payload: Payload, req?: PayloadRequest) {
  const sections = await payload.find({
    collection: 'sections',
    select: { scenario: true },
    req,
    ...OPTS,
  })
  return new Map(sections.docs.map((section) => [section.id, section.scenario ?? null]))
}

/** Заполненность одного товара по его полям, числу предложений и сценарию раздела. */
export function qualityOf(
  product: QualitySource,
  counts: Counts | undefined,
  scenarios: Map<number, string | null>,
): ProductQuality {
  const main = relId(product.mainSection)
  const scenario = resolveScenario({
    own: product.scenario,
    section: main == null ? null : (scenarios.get(main) ?? null),
    kind: product.kind,
  })
  return productQuality({
    offers: counts?.all ?? 0,
    priced: counts?.priced ?? 0,
    hasImage: relIds(product.gallery).length > 0,
    hasDescription: Boolean(product.description?.trim()),
    hasSummary: Boolean(product.summary?.trim()),
    hasSection: main != null || relIds(product.extraSections).length > 0,
    needsPrice: scenario === 'standard' || scenario === 'renewal',
  })
}

/** Отметка для записи в товар. */
export function qualityFields(quality: ProductQuality): QualityFields {
  return { qualityScore: quality.score, qualityGaps: quality.gaps }
}

function sameFields(product: QualityFields, fields: QualityFields) {
  const before = product.qualityGaps ?? []
  const after = fields.qualityGaps ?? []
  return (
    product.qualityScore === fields.qualityScore &&
    before.length === after.length &&
    before.every((gap, index) => gap === after[index])
  )
}

/** Отметка одного товара перед сохранением (данные ещё не в базе). */
export async function qualityForSave(
  payload: Payload,
  product: QualitySource,
  id: number | null,
  req: PayloadRequest,
): Promise<QualityFields> {
  const counts = id == null ? new Map<number, Counts>() : await offerCounts(payload, [id], req)
  const scenarios = await sectionScenarios(payload, req)
  return qualityFields(qualityOf(product, id == null ? undefined : counts.get(id), scenarios))
}

/**
 * Пересчитать отметку у товаров (null — у всех) и записать там, где она изменилась. Запись мимо
 * хуков и истории: это служебная отметка, а не правка человека. Возвращает число обновлённых.
 */
export async function refreshQuality(
  payload: Payload,
  ids: number[] | null,
  req?: PayloadRequest,
): Promise<number> {
  if (ids !== null && ids.length === 0) return 0
  const products = await payload.find({
    collection: 'products',
    where: ids === null ? {} : { id: { in: ids } },
    select: { ...QUALITY_SELECT, qualityScore: true, qualityGaps: true },
    req,
    ...OPTS,
  })
  const counts = await offerCounts(payload, ids, req)
  const scenarios = await sectionScenarios(payload, req)
  let changed = 0
  for (const product of products.docs) {
    const fields = qualityFields(qualityOf(product, counts.get(product.id), scenarios))
    if (sameFields(product, fields)) continue
    await writeQuality(payload, product.id, fields, req)
    changed++
  }
  return changed
}

/**
 * Записать отметку прямо в таблицы товара: без хуков, версии в истории и смены «Изменено» —
 * обычное сохранение Payload сделало бы и то, и другое. Внутри запроса — в его же транзакции.
 */
async function writeQuality(
  payload: Payload,
  id: number,
  fields: QualityFields,
  req?: PayloadRequest,
) {
  const adapter = payload.db as unknown as PostgresAdapter
  const session = req?.transactionID ? adapter.sessions[await req.transactionID] : undefined
  const db = session?.db ?? adapter.drizzle
  await db.execute(sql`update products set quality_score = ${fields.qualityScore} where id = ${id}`)
  await db.execute(sql`delete from products_quality_gaps where parent_id = ${id}`)
  for (const [index, gap] of (fields.qualityGaps ?? []).entries())
    await db.execute(
      sql`insert into products_quality_gaps ("order", parent_id, value) values (${index + 1}, ${id}, ${gap})`,
    )
}
