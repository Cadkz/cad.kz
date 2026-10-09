import type { Payload } from 'payload'
import type { Offer, Product } from '../../payload-types'
import { matchRows, nameKey, type PriceRow } from '../domain/priceList.mjs'
import { formatKzt } from './format'
import { loadPricingContext, type PricingContext, quoteOffer } from './pricing'
import { relId } from './rel'

/**
 * Загрузка прайса производителя в админке (страница «Загрузить прайс»). Файл читается в браузере,
 * сюда приходят только строки: название, ID (если есть) и цена в исходной валюте. Сервер сам находит
 * предложения, сам считает старую и новую цену в тенге (src/domain/pricing.mjs) и сам записывает.
 */

const opts = { overrideAccess: true, depth: 0 } as const
const CURRENCIES = ['KZT', 'USD', 'EUR', 'RUB'] as const
type Currency = (typeof CURRENCIES)[number]
const AMOUNT = /^\d{1,12}(\.\d{1,6})?$/
const VAT = /^\d{1,2}(\.\d{1,2})?$/
export const MAX_ROWS = 3000

export type PriceSettings = { currency: Currency; includesVat: boolean; sourceVat: string }
export type Reply =
  | { ok: true; [key: string]: unknown }
  | { ok: false; status: number; error: string }

const fail = (error: string, status = 400): Reply => ({ ok: false, status, error })

function settings(data: Record<string, unknown>): PriceSettings | string {
  const currency = CURRENCIES.find((c) => c === data.currency)
  if (!currency) return 'Выберите валюту прайса'
  const sourceVat = String(data.sourceVat ?? '')
  if (!VAT.test(sourceVat) || Number(sourceVat) > 99) return 'Ставка НДС в прайсе: число от 0 до 99'
  return { currency, includesVat: data.includesVat === true, sourceVat }
}

/** Производители для выбора «Чей прайс»: сколько предложений и в какой валюте они обычно. */
export async function priceListVendors(payload: Payload) {
  const [vendors, products, offers] = await Promise.all([
    payload.find({ collection: 'manufacturers', pagination: false, sort: 'title', ...opts }),
    payload.find({
      collection: 'products',
      pagination: false,
      ...opts,
      select: { manufacturer: true },
    }),
    payload.find({
      collection: 'offers',
      pagination: false,
      ...opts,
      select: { product: true, currency: true, includesVat: true, sourceVat: true },
    }),
  ])
  const vendorOf = new Map(products.docs.map((p) => [p.id, relId(p.manufacturer)]))
  const stats = new Map<number, { count: number; currencies: Map<string, number> }>()
  for (const offer of offers.docs) {
    const vendor = vendorOf.get(relId(offer.product) ?? -1)
    if (vendor == null) continue
    const entry = stats.get(vendor) ?? { count: 0, currencies: new Map() }
    entry.count++
    const key = `${offer.currency}|${offer.includesVat ? 1 : 0}|${offer.sourceVat}`
    entry.currencies.set(key, (entry.currencies.get(key) ?? 0) + 1)
    stats.set(vendor, entry)
  }
  return vendors.docs
    .map((vendor) => {
      const entry = stats.get(vendor.id)
      // Валюта и НДС, как у большинства предложений производителя: подсказка для формы.
      const usual = [...(entry?.currencies ?? new Map<string, number>())].sort(
        (a, b) => b[1] - a[1],
      )[0]?.[0]
      const [currency = 'KZT', vat = '0', sourceVat = '16'] = usual?.split('|') ?? []
      return {
        id: vendor.id,
        title: vendor.title,
        offers: entry?.count ?? 0,
        currency,
        includesVat: vat === '1',
        sourceVat,
      }
    })
    .filter((vendor) => vendor.offers > 0)
}

type OfferRow = { offer: Offer; product: Pick<Product, 'id' | 'title'> }

/** Предложения производителя (или всего каталога) с названиями товаров. */
async function loadOffers(payload: Payload, vendor: number | null): Promise<OfferRow[]> {
  const products = await payload.find({
    collection: 'products',
    pagination: false,
    ...opts,
    where: vendor == null ? {} : { manufacturer: { equals: vendor } },
    select: { title: true },
  })
  const byId = new Map(products.docs.map((p) => [p.id, p]))
  if (!byId.size) return []
  const offers = await payload.find({
    collection: 'offers',
    pagination: false,
    ...opts,
    where: { product: { in: [...byId.keys()] } },
  })
  return offers.docs.flatMap((offer) => {
    const product = byId.get(relId(offer.product) ?? -1)
    return product ? [{ offer, product }] : []
  })
}

/** Подпись предложения: товар, комплектация и лицензия, без пустых «Базовая» и «—». */
export function offerLabel({ offer, product }: OfferRow) {
  const parts = [offer.configuration, offer.license].filter(
    (part) => part && part !== '—' && part.toLowerCase() !== 'базовая',
  )
  return [product.title, ...parts].join(' · ')
}

function kzt(
  offer: Pick<Offer, 'amount' | 'currency' | 'includesVat' | 'sourceVat'>,
  context: PricingContext,
) {
  try {
    return formatKzt(quoteOffer(offer, context).unitKzt)
  } catch {
    return null
  }
}

function readRows(raw: unknown): PriceRow[] | string {
  if (!Array.isArray(raw) || raw.length === 0) return 'В прайсе не нашлось строк с названием'
  if (raw.length > MAX_ROWS) return `Слишком много строк: больше ${MAX_ROWS}. Разделите прайс.`
  const rows: PriceRow[] = []
  for (const item of raw) {
    if (!item || typeof item !== 'object') return 'Некорректная строка прайса'
    const row = item as Record<string, unknown>
    const price = row.price == null ? null : String(row.price)
    if (price != null && !AMOUNT.test(price)) return 'Некорректная цена в прайсе'
    const alt = Array.isArray(row.alt)
      ? row.alt.slice(0, 3).map((name) => String(name ?? '').slice(0, 300))
      : []
    rows.push({
      index: Number(row.index) || 0,
      name: String(row.name ?? '').slice(0, 300),
      id: String(row.id ?? '').slice(0, 20),
      price,
      ...(alt.length ? { alt } : {}),
    })
  }
  return rows
}

/**
 * Проверка прайса: для каждой строки — найденное предложение, как нашлось, цена сейчас и после
 * загрузки в тенге. Ничего не записывает.
 */
export async function previewPriceList(
  payload: Payload,
  data: Record<string, unknown>,
): Promise<Reply> {
  const config = settings(data)
  if (typeof config === 'string') return fail(config)
  const rows = readRows(data.rows)
  if (typeof rows === 'string') return fail(rows)
  const vendor = data.vendor == null ? null : Number(data.vendor)
  if (vendor != null && !Number.isSafeInteger(vendor)) return fail('Некорректный производитель')

  const [offers, context] = await Promise.all([
    loadOffers(payload, vendor),
    loadPricingContext(payload),
  ])
  if (!offers.length) return fail('У этого производителя нет предложений с ценами на сайте')
  const byId = new Map(offers.map((row) => [row.offer.id, row]))
  const matches = matchRows(
    rows,
    offers.map((row) => ({
      id: row.offer.id,
      label: offerLabel(row),
      names: row.offer.priceNames ?? [],
    })),
  )
  const rowByIndex = new Map(rows.map((row) => [row.index, row]))
  return {
    ok: true,
    rows: matches.map((match) => {
      const row = rowByIndex.get(match.index)
      const found = match.offerId == null ? null : byId.get(match.offerId)
      const next = found && row?.price ? { ...config, amount: row.price } : null
      return {
        ...match,
        name: row?.name ?? '',
        price: row?.price ?? null,
        oldAmount: found ? `${found.offer.amount} ${found.offer.currency}` : null,
        oldKzt: found ? kzt(found.offer, context) : null,
        newKzt: next ? kzt(next, context) : null,
      }
    }),
    offers: offers
      .map((row) => ({ id: row.offer.id, label: offerLabel(row) }))
      .sort((a, b) => a.label.localeCompare(b.label, 'ru', { numeric: true })),
    rate: config.currency === 'KZT' ? null : (context.rates.get(config.currency)?.value ?? null),
  }
}

/** Пересчёт одной цены для строки, где менеджер выбрал предложение вручную. */
export async function quoteRow(payload: Payload, data: Record<string, unknown>): Promise<Reply> {
  const config = settings(data)
  if (typeof config === 'string') return fail(config)
  const id = Number(data.offerId)
  const price = String(data.price ?? '')
  if (!Number.isSafeInteger(id) || !AMOUNT.test(price)) return fail('Некорректная строка')
  const offer = await payload.findByID({ collection: 'offers', id, ...opts }).catch(() => null)
  if (!offer) return fail('Предложение не найдено', 404)
  const context = await loadPricingContext(payload)
  return {
    ok: true,
    oldAmount: `${offer.amount} ${offer.currency}`,
    oldKzt: kzt(offer, context),
    newKzt: kzt({ ...config, amount: price }, context),
  }
}

/**
 * Запись цен. Каждое предложение — не больше одного раза. Название строки прайса запоминается
 * у предложения (поле «Названия в прайсах производителя»), чтобы в следующий раз найтись сразу.
 * Итог — в журнале «Запуски импорта».
 */
export async function applyPriceList(
  payload: Payload,
  data: Record<string, unknown>,
  userId: string,
): Promise<Reply> {
  const config = settings(data)
  if (typeof config === 'string') return fail(config)
  if (!Array.isArray(data.items) || !data.items.length) return fail('Нет строк для записи')
  if (data.items.length > MAX_ROWS) return fail('Слишком много строк')
  const items: { offerId: number; amount: string; name: string }[] = []
  const seen = new Set<number>()
  for (const raw of data.items) {
    const item = (raw ?? {}) as Record<string, unknown>
    const offerId = Number(item.offerId)
    const amount = String(item.amount ?? '')
    if (!Number.isSafeInteger(offerId) || !AMOUNT.test(amount))
      return fail('Некорректная строка прайса')
    if (seen.has(offerId))
      return fail('Одно предложение выбрано в двух строках прайса. Оставьте одну.')
    seen.add(offerId)
    items.push({ offerId, amount, name: String(item.name ?? '').slice(0, 300) })
  }

  const report = {
    changed: 0,
    same: 0,
    missing: 0,
    file: String(data.fileName ?? '').slice(0, 200),
    ...config,
  }
  const changes: { offer: number; from: string; to: string }[] = []
  for (const item of items) {
    const offer = await payload
      .findByID({ collection: 'offers', id: item.offerId, ...opts })
      .catch(() => null)
    if (!offer) {
      report.missing++
      continue
    }
    const names = offer.priceNames ?? []
    const remember =
      data.remember !== false &&
      item.name &&
      !names.some((name) => nameKey(name) === nameKey(item.name))
    const same =
      offer.amount === item.amount &&
      offer.currency === config.currency &&
      Boolean(offer.includesVat) === config.includesVat &&
      offer.sourceVat === config.sourceVat
    if (same && !remember) {
      report.same++
      continue
    }
    await payload.update({
      collection: 'offers',
      id: offer.id,
      data: {
        amount: item.amount,
        currency: config.currency,
        includesVat: config.includesVat,
        sourceVat: config.sourceVat,
        ...(remember ? { priceNames: [...names, item.name] } : {}),
      },
      ...opts,
    })
    if (same) report.same++
    else {
      report.changed++
      changes.push({
        offer: offer.id,
        from: `${offer.amount} ${offer.currency}`,
        to: `${item.amount} ${config.currency}`,
      })
    }
  }
  await payload.create({
    collection: 'import-runs',
    data: {
      idempotencyKey: `price-list:${Date.now()}:${userId}`,
      state: 'done',
      snapshot: { kind: 'price-list', user: userId, ...report, changes },
    },
    ...opts,
  })
  return { ok: true, changed: report.changed, same: report.same, missing: report.missing }
}

/** Текущие цены производителя для файла «Скачать текущие цены» (с ID — для точной обратной загрузки). */
export async function currentPrices(
  payload: Payload,
  data: Record<string, unknown>,
): Promise<Reply> {
  const vendor = data.vendor == null ? null : Number(data.vendor)
  if (vendor != null && !Number.isSafeInteger(vendor)) return fail('Некорректный производитель')
  const offers = await loadOffers(payload, vendor)
  return {
    ok: true,
    rows: offers
      .map((row) => ({
        id: row.offer.id,
        label: offerLabel(row),
        amount: row.offer.amount,
        currency: row.offer.currency,
        includesVat: Boolean(row.offer.includesVat),
      }))
      .sort((a, b) => a.label.localeCompare(b.label, 'ru', { numeric: true })),
  }
}
