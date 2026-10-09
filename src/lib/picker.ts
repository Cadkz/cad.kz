import type { Payload } from 'payload'
import {
  offersAsPicker,
  type PickerOffer,
  type PickerStep,
  type PickerView,
} from '@/domain/picker.mjs'
import type { Offer, Product } from '../../payload-types'
import { formatKzt } from './format'
import { loadPricingContext, type PricingContext, quoteOffer } from './pricing'
import { relId } from './rel'

const published = { status: { equals: 'published' } } as const

/** Цена за единицу с НДС для показа. Нет курса — null, вариант будет «по запросу». */
function unitPrice(offer: Offer, context: PricingContext) {
  try {
    return quoteOffer(offer, context).unitKzt
  } catch {
    return null
  }
}

/** Предложения товара для подбора: от дешёвого к дорогому, с ценой, посчитанной сервером. */
export function pickerOffers(offers: Offer[], context: PricingContext): PickerOffer[] {
  return offers
    .map((offer) => ({ offer, unit: unitPrice(offer, context) }))
    .sort((a, b) => Number(BigInt(a.unit ?? '0') - BigInt(b.unit ?? '0')))
    .map(({ offer, unit }) => ({
      id: String(offer.id),
      configuration: offer.configuration,
      variants: offer.variants ?? [],
      price: unit ? formatKzt(unit) : null,
    }))
}

/** Опубликованные предложения нескольких товаров одним запросом. */
export async function offersOf(payload: Payload, productIds: number[]) {
  const { docs } = await payload.find({
    collection: 'offers',
    where: { and: [published, { product: { in: productIds } }] },
    pagination: false,
    depth: 0,
  })
  const byProduct = new Map<number, Offer[]>()
  for (const offer of docs) {
    const id = relId(offer.product)
    if (id != null) byProduct.set(id, [...(byProduct.get(id) ?? []), offer])
  }
  return byProduct
}

/**
 * Подбор для страницы товара. Товар с видом «С подбором» — шаги из админки, варианты — товары,
 * у каждого его опубликованные предложения. Остальные — один шаг из своих предложений.
 */
export async function loadPicker(payload: Payload, product: Product): Promise<PickerView> {
  const context = await loadPricingContext(payload)
  const steps = product.pageView === 'picker' ? (product.picker?.steps ?? []) : []
  const itemIds = steps.flatMap((step) => (step.items ?? []).map((i) => relId(i.product)))
  const ids = [...new Set([product.id, ...itemIds.filter((id): id is number => id != null)])]
  const [offers, products] = await Promise.all([
    offersOf(payload, ids),
    payload.find({
      collection: 'products',
      where: { and: [published, { id: { in: ids } }] },
      pagination: false,
      depth: 0,
      select: { title: true },
    }),
  ])

  if (!steps.length) {
    const own = offers.get(product.id) ?? []
    const licenses = Object.fromEntries(own.map((o) => [String(o.id), o.license]))
    return offersAsPicker(product.id, pickerOffers(own, context), licenses)
  }

  const titles = new Map(products.docs.map((p) => [p.id, p.title]))
  const view: PickerView = {
    switches: (product.picker?.switches ?? []).map((sw, index) => ({
      key: sw.id ?? `s${index}`,
      title: sw.title,
      options: (sw.options ?? []).map((o) => ({ value: o.value, note: o.note ?? null })),
    })),
    steps: steps.flatMap((step, index): PickerStep[] => {
      const items = (step.items ?? []).flatMap((entry, n) => {
        const productId = relId(entry.product)
        const title = productId == null ? undefined : titles.get(productId)
        if (productId == null || !title) return []
        return [
          {
            key: entry.id ?? `i${index}-${n}`,
            productId,
            label: entry.label || title,
            note: entry.note || null,
            offers: pickerOffers(offers.get(productId) ?? [], context),
            fixedOffers: (entry.offers ?? []).map((offer) => String(relId(offer))),
            preselect: Boolean(entry.preselect),
          },
        ]
      })
      if (!items.length) return []
      return [
        {
          key: step.id ?? `st${index}`,
          title: step.title,
          hint: step.hint || null,
          mode: step.mode,
          collapsed: Boolean(step.collapsed),
          items,
        },
      ]
    }),
  }
  return view
}
