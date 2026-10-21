import type { Payload } from 'payload'
import { resolveScenario, SCENARIO_LABELS } from '@/domain/buyScenario.mjs'
import { relId } from './rel'

const options = { overrideAccess: true, depth: 0 } as const

type LeadItem = { offerId: string }

/** Строки лида: снимок заказа уже проверен сервером, здесь только защита от неожиданной формы. */
function leadItems(lead: Record<string, unknown>): LeadItem[] {
  if (!Array.isArray(lead.items)) return []
  return lead.items.filter(
    (item): item is LeadItem => typeof item === 'object' && item !== null && 'offerId' in item,
  )
}

/**
 * Заказ из корзины для Битрикс24: у каждой строки — раздел и сценарий покупки товара, источник —
 * кнопка «Оформить заказ» в корзине. Так в сделке видно, из какого направления пришёл заказ.
 * Сбой поиска не мешает заказу: строки уходят без раздела.
 */
export async function withOrderContext(
  payload: Payload,
  lead: Record<string, unknown>,
): Promise<Record<string, unknown>> {
  const source = {
    button: 'Оформить заказ (корзина)',
    product: null,
    section: null,
    scenario: null,
    page: '/checkout',
  }
  try {
    const items = leadItems(lead)
    const ids = items.map((item) => Number(item.offerId)).filter(Number.isSafeInteger)
    const offers = await payload.find({
      collection: 'offers',
      where: { id: { in: ids } },
      pagination: false,
      select: { product: true },
      ...options,
    })
    const productOf = new Map(offers.docs.map((offer) => [String(offer.id), relId(offer.product)]))
    const productIds = [...new Set([...productOf.values()].filter((id) => id != null))]
    const products = await payload.find({
      collection: 'products',
      where: { id: { in: productIds } },
      pagination: false,
      overrideAccess: true,
      depth: 1,
      select: { kind: true, scenario: true, mainSection: true },
    })
    const info = new Map(
      products.docs.map((product) => {
        const main = typeof product.mainSection === 'object' ? product.mainSection : null
        const scenario = resolveScenario({
          own: product.scenario,
          section: main?.scenario,
          kind: product.kind,
        })
        return [product.id, { section: main?.title, scenario: SCENARIO_LABELS[scenario] }]
      }),
    )
    return {
      ...lead,
      source,
      items: items.map((item) => {
        const id = productOf.get(item.offerId)
        const found = id == null ? undefined : info.get(id)
        return found ? { ...item, ...found } : item
      }),
    }
  } catch {
    return { ...lead, source }
  }
}
