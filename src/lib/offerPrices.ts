import type { Payload } from 'payload'
import { groupOf, type TreeGroup } from '@/domain/adminCatalog.mjs'
import { AMOUNT, CURRENCIES, priceChange, priceEditSummary } from '@/domain/priceEdit.mjs'
import type { Offer } from '../../payload-types'
import { logActivity } from './activity'
import type { Reply } from './priceListRun'
import { loadPricingContext, type PricingContext, quoteOffer } from './pricing'
import { relId } from './rel'

/**
 * «Цены таблицей» в админке: все предложения одной таблицей, правка цены в ячейке, сводка перед
 * применением. Браузер присылает только ID предложения, новую цену и валюту; цену в тенге
 * сервер считает сам (src/domain/pricing.mjs) и сам же проверяет, не правил ли цену кто-то ещё.
 */

const opts = { overrideAccess: true, depth: 0 } as const
export const MAX_EDITS = 3000

type Currency = Offer['currency']
type Priced = Pick<Offer, 'amount' | 'currency' | 'includesVat' | 'sourceVat'>

export type PriceGridRow = {
  id: number
  productId: number
  product: string
  /** Комплектация и лицензия без пустых «Базовая» и «—». */
  details: string
  /** Товар и комплектация одной строкой — для поиска. */
  label: string
  /** Вкладка, как в «Каталоге»: программы, оборудование, услуги и обучение. */
  group: TreeGroup
  vendor: number | null
  section: number | null
  published: boolean
  amount: string
  currency: Currency
  includesVat: boolean
  sourceVat: string
  /** Цена на сайте сейчас, целые тенге; null — не считается (нет курса). */
  kzt: string | null
  noPrice: boolean
}

export type PriceGridData = {
  rows: PriceGridRow[]
  vendors: { id: number; title: string }[]
  sections: { id: number; title: string }[]
  rates: { currency: string; value: string }[]
  vat: string
}

function unitKzt(offer: Priced, context: PricingContext) {
  try {
    return quoteOffer(offer, context).unitKzt
  } catch {
    return null
  }
}

const isPart = (part: string | null | undefined): part is string =>
  Boolean(part && part !== '—' && part.toLowerCase() !== 'базовая')

/** Все предложения с товарами, производителями и разделами для таблицы. */
export async function loadPriceGrid(payload: Payload): Promise<PriceGridData> {
  const [offers, products, vendors, sections, context] = await Promise.all([
    payload.find({ collection: 'offers', pagination: false, ...opts }),
    payload.find({
      collection: 'products',
      pagination: false,
      ...opts,
      select: { title: true, kind: true, status: true, manufacturer: true, mainSection: true },
    }),
    payload.find({
      collection: 'manufacturers',
      pagination: false,
      sort: 'title',
      ...opts,
      select: { title: true },
    }),
    payload.find({
      collection: 'sections',
      pagination: false,
      sort: 'title',
      ...opts,
      select: { title: true },
    }),
    loadPricingContext(payload),
  ])
  const productById = new Map(products.docs.map((product) => [product.id, product]))
  const rows = offers.docs.flatMap((offer): PriceGridRow[] => {
    const product = productById.get(relId(offer.product) ?? -1)
    if (!product) return []
    const details = [offer.configuration, offer.license].filter(isPart).join(' · ')
    const kzt = unitKzt(offer, context)
    return [
      {
        id: offer.id,
        productId: product.id,
        product: product.title,
        details,
        label: [product.title, details].filter(Boolean).join(' · '),
        group: groupOf(product.kind),
        vendor: relId(product.manufacturer),
        section: relId(product.mainSection),
        published: offer.status === 'published' && product.status === 'published',
        amount: offer.amount,
        currency: offer.currency,
        includesVat: Boolean(offer.includesVat),
        sourceVat: offer.sourceVat,
        kzt,
        noPrice: !kzt || kzt === '0',
      },
    ]
  })
  rows.sort((a, b) => a.label.localeCompare(b.label, 'ru', { numeric: true }))
  const used = (key: 'vendor' | 'section') => new Set(rows.map((row) => row[key]))
  const usedVendors = used('vendor')
  const usedSections = used('section')
  return {
    rows,
    vendors: vendors.docs
      .filter((vendor) => usedVendors.has(vendor.id))
      .map(({ id, title }) => ({ id, title })),
    sections: sections.docs
      .filter((section) => usedSections.has(section.id))
      .map(({ id, title }) => ({ id, title })),
    rates: [...context.rates.entries()]
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([currency, rate]) => ({ currency, value: rate.value })),
    vat: context.vat,
  }
}

type Edit = {
  offerId: number
  amount: string
  currency: Currency
  was?: string
  wasCurrency?: Currency
}

const fail = (error: string, status = 400): Reply => ({ ok: false, status, error })

function readEdits(raw: unknown): Edit[] | string {
  if (!Array.isArray(raw) || !raw.length) return 'Нет изменённых цен'
  if (raw.length > MAX_EDITS) return `Слишком много изменений: больше ${MAX_EDITS}`
  const edits: Edit[] = []
  const seen = new Set<number>()
  for (const item of raw) {
    const row = (item ?? {}) as Record<string, unknown>
    const offerId = Number(row.offerId)
    const amount = String(row.amount ?? '')
    const currency = CURRENCIES.find((c: string) => c === row.currency) as Currency | undefined
    if (!Number.isSafeInteger(offerId) || offerId <= 0 || !AMOUNT.test(amount) || !currency)
      return 'Некорректная цена: только цифры, дробная часть через точку или запятую'
    if (seen.has(offerId)) return 'Одно предложение пришло дважды. Обновите страницу.'
    seen.add(offerId)
    const was = row.was == null ? undefined : String(row.was)
    const wasCurrency = CURRENCIES.find((c: string) => c === row.wasCurrency) as
      | Currency
      | undefined
    edits.push({ offerId, amount, currency, was, wasCurrency })
  }
  return edits
}

async function loadOffers(payload: Payload, ids: number[]) {
  const found = await payload.find({
    collection: 'offers',
    where: { id: { in: ids } },
    pagination: false,
    ...opts,
  })
  return new Map(found.docs.map((offer) => [offer.id, offer]))
}

/** Цена в тенге сейчас и после правки, процент изменения. Ничего не записывает. */
export async function previewEdits(
  payload: Payload,
  data: Record<string, unknown>,
): Promise<Reply> {
  const edits = readEdits(data.items)
  if (typeof edits === 'string') return fail(edits)
  const [offers, context] = await Promise.all([
    loadOffers(
      payload,
      edits.map((edit) => edit.offerId),
    ),
    loadPricingContext(payload),
  ])
  return {
    ok: true,
    rows: edits.map((edit) => {
      const offer = offers.get(edit.offerId)
      if (!offer) return { offerId: edit.offerId, missing: true }
      const oldKzt = unitKzt(offer, context)
      const newKzt = unitKzt({ ...offer, amount: edit.amount, currency: edit.currency }, context)
      return {
        offerId: edit.offerId,
        oldKzt,
        newKzt,
        change: priceChange(oldKzt, newKzt),
        noRate: newKzt === null,
      }
    }),
  }
}

/**
 * Запись правок. Цена записывается, только если у предложения всё ещё та цена, которую видел
 * человек (was): иначе её успел поменять кто-то другой или загрузка прайса — такие строки
 * возвращаются, ничего не затирая. Изменения больше 30 % — только с подтверждением (confirmBig).
 */
export async function applyEdits(
  payload: Payload,
  data: Record<string, unknown>,
  user: { id: number | string },
): Promise<Reply> {
  const edits = readEdits(data.items)
  if (typeof edits === 'string') return fail(edits)
  const [offers, context] = await Promise.all([
    loadOffers(
      payload,
      edits.map((edit) => edit.offerId),
    ),
    loadPricingContext(payload),
  ])
  const planned = edits.map((edit) => {
    const offer = offers.get(edit.offerId)
    if (!offer) return { edit, offer: null, conflict: true }
    const conflict =
      (edit.was !== undefined && edit.was !== offer.amount) ||
      (edit.wasCurrency !== undefined && edit.wasCurrency !== offer.currency)
    const oldKzt = unitKzt(offer, context)
    const newKzt = unitKzt({ ...offer, amount: edit.amount, currency: edit.currency }, context)
    return { edit, offer, conflict, oldKzt, newKzt, change: priceChange(oldKzt, newKzt) }
  })
  if (planned.some((item) => !item.conflict && item.offer && item.newKzt === null))
    return fail('Для одной из валют не задан курс. Добавьте его на странице «Курсы валют».')
  const big = planned.filter((item) => !item.conflict && item.change?.big).length
  if (big && data.confirmBig !== true)
    return fail('Есть изменения больше 30 %: подтвердите их галочкой в сводке.')

  const changes: { offer: number; from: string; to: string; kzt: string }[] = []
  const conflicts: number[] = []
  const saved: { id: number; amount: string; currency: Currency; kzt: string | null }[] = []
  for (const item of planned) {
    const { edit, offer } = item
    if (!offer || item.conflict) {
      conflicts.push(edit.offerId)
      continue
    }
    if (offer.amount === edit.amount && offer.currency === edit.currency) continue
    await payload.update({
      collection: 'offers',
      id: offer.id,
      data: { amount: edit.amount, currency: edit.currency },
      overrideAccess: true,
      depth: 0,
      // От имени человека: «Последним правил» и версия в истории — его.
      user: { ...user, collection: 'users' },
    })
    changes.push({
      offer: offer.id,
      from: `${offer.amount} ${offer.currency}`,
      to: `${edit.amount} ${edit.currency}`,
      kzt: `${item.oldKzt ?? '—'} → ${item.newKzt ?? '—'}`,
    })
    saved.push({ id: offer.id, amount: edit.amount, currency: edit.currency, kzt: item.newKzt })
  }
  if (changes.length)
    await logActivity(payload, {
      action: 'prices',
      summary: priceEditSummary({
        changed: changes.length,
        big,
        conflicts: conflicts.length,
      }),
      userId: user.id,
      link: '/admin/prices',
      details: { changes: changes.slice(0, 200) },
    })
  return { ok: true, saved, conflicts }
}
