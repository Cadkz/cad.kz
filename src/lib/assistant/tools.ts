import type { Payload } from 'payload'
import type { AssistantCard } from '@/domain/assistant.mjs'
import { formatKzt } from '../format'
import { findPublicOffer, loadPricingContext, quoteOffer } from '../pricing'
import { searchCatalog } from '../search'

/** Сколько товаров отдаёт поиск модели за раз. */
const SEARCH_LIMIT = 6
const OFFERS_LIMIT = 30

export type ToolRunner = {
  run: (name: string, input: unknown) => Promise<unknown>
  /** Товары, которые находил поиск в этом ответе: из них собираются ссылки под ответом. */
  found: AssistantCard[]
}

function field(input: unknown, name: string) {
  return input && typeof input === 'object' ? (input as Record<string, unknown>)[name] : undefined
}

/** Карточка под ответом: без описания — оно нужно только модели. */
export function toCard({ id, title, href, vendor, price }: AssistantCard): AssistantCard {
  return { id, title, href, vendor, price }
}

/** Поиск по каталогу тем же поиском, что в шапке сайта (src/lib/search.ts). */
export async function findCards(
  query: string,
): Promise<(AssistantCard & { summary: string | null })[]> {
  const text = query.replace(/\s+/g, ' ').trim().slice(0, 120)
  if (text.length < 2) return []
  const { items } = await searchCatalog(text)
  return items.slice(0, SEARCH_LIMIT).map((item) => ({
    id: item.id,
    title: item.title,
    href: item.href,
    vendor: item.manufacturer,
    price: item.priceFrom ? `от ${item.priceFrom}` : null,
    summary: item.summary,
  }))
}

/**
 * Инструменты модели: поиск, комплектации, цена. Всё — только опубликованное, цена — только
 * серверный расчёт src/domain/pricing.mjs. Ошибку ввода инструмент возвращает словами,
 * чтобы модель поправилась, а не придумывала ответ.
 */
export function createTools(payload: Payload): ToolRunner {
  const found: AssistantCard[] = []
  let pricing: Awaited<ReturnType<typeof loadPricingContext>> | null = null

  async function searchProducts(input: unknown) {
    const query = field(input, 'query')
    if (typeof query !== 'string') return { error: 'Нужен текст запроса' }
    const cards = await findCards(query)
    for (const card of cards) if (!found.some((f) => f.id === card.id)) found.push(toCard(card))
    if (!cards.length) return { products: [], note: 'Ничего не нашлось' }
    return {
      products: cards.map((card) => ({
        id: card.id,
        title: card.title,
        vendor: card.vendor,
        family: card.id < 0,
        summary: card.summary?.slice(0, 240) ?? null,
        price: card.price ?? 'по запросу',
      })),
    }
  }

  async function getOffers(input: unknown) {
    const id = Number(field(input, 'productId'))
    if (!Number.isSafeInteger(id) || id === 0) return { error: 'Нужен ID товара из поиска' }
    if (id < 0) return { error: 'Это семейство программ: комплектации — у программ семейства' }
    const { docs } = await payload.find({
      collection: 'offers',
      where: { and: [{ product: { equals: id } }, { status: { equals: 'published' } }] },
      limit: OFFERS_LIMIT,
      depth: 1,
      overrideAccess: true,
    })
    const offers = docs.filter(
      (offer) => typeof offer.product === 'object' && offer.product?.status === 'published',
    )
    if (!offers.length) return { offers: [], note: 'Комплектаций с ценой нет — цена по запросу' }
    return {
      offers: offers.map((offer) => ({
        offerId: offer.id,
        configuration: offer.configuration,
        license: offer.license,
        variants: offer.variants ?? [],
      })),
    }
  }

  async function quote(input: unknown) {
    const offerId = Number(field(input, 'offerId'))
    const quantity = Number(field(input, 'quantity') ?? 1)
    if (!Number.isSafeInteger(offerId) || offerId <= 0)
      return { error: 'Нужен ID комплектации из getOffers' }
    if (!Number.isInteger(quantity) || quantity < 1 || quantity > 999)
      return { error: 'Количество от 1 до 999' }
    const offer = await findPublicOffer(payload, String(offerId))
    if (!offer) return { error: 'Комплектация не найдена или снята с продажи' }
    pricing ??= await loadPricingContext(payload)
    try {
      const result = quoteOffer(offer.offer, pricing, quantity)
      return {
        product: offer.product.title,
        configuration: offer.offer.configuration,
        license: offer.offer.license,
        quantity,
        unit: formatKzt(result.unitKzt),
        total: formatKzt(result.totalKzt),
        note: 'Розничная цена в тенге с НДС',
      }
    } catch {
      return { error: 'Цену этой комплектации сейчас назовёт только менеджер' }
    }
  }

  const tools: Record<string, (input: unknown) => Promise<unknown>> = {
    searchProducts,
    getOffers,
    quote,
  }
  return {
    found,
    run(name, input) {
      const tool = tools[name]
      return tool ? tool(input) : Promise.resolve({ error: `Нет инструмента ${name}` })
    },
  }
}
