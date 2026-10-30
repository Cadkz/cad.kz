import type { Payload } from 'payload'
import {
  AUTODESK_NO_PRICE,
  AUTODESK_SITE_PRICES,
  planOffers,
  type VendorPrices,
} from '../domain/vendorPrices.mjs'
import { logActivity } from './activity'

const opts = { overrideAccess: true, depth: 0 } as const

const kzt = (amount: string) => `${amount.split('.')[0]?.replace(/\B(?=(\d{3})+(?!\d))/g, ' ')} ₸`

/**
 * Цены товаров Autodesk из прайс-листа (вместе с загрузкой прайс-листа в «Прайс и база Кадди»).
 * Только опубликованные товары; у каждого — подписки на 1 и 3 года по РЦКП (тенге с НДС),
 * на сайте цена округляется вниз до тысячи. Возвращает отчёт строками для владельца.
 */
export async function applyVendorPrices(
  payload: Payload,
  prices: VendorPrices,
  userId: number | string | null,
): Promise<string[]> {
  const report: string[] = []
  const slugs = [
    ...AUTODESK_SITE_PRICES.map((entry) => entry.slug),
    ...Object.keys(AUTODESK_NO_PRICE),
  ]
  const { docs: products } = await payload.find({
    collection: 'products',
    where: { and: [{ slug: { in: slugs } }, { status: { equals: 'published' } }] },
    pagination: false,
    ...opts,
  })
  let changed = 0
  let created = 0
  for (const entry of AUTODESK_SITE_PRICES) {
    const product = products.find((item) => item.slug === entry.slug)
    if (!product) continue
    const terms = prices[entry.name]
    if (!terms || !Object.keys(terms).length) {
      report.push(`${product.title}: нет в прайс-листе — цена не менялась`)
      continue
    }
    const { docs: offers } = await payload.find({
      collection: 'offers',
      where: { and: [{ product: { equals: product.id } }, { status: { equals: 'published' } }] },
      pagination: false,
      ...opts,
    })
    const plan = planOffers(
      offers.map((offer) => ({
        id: offer.id,
        configuration: offer.configuration,
        license: offer.license,
        amount: offer.amount,
        currency: offer.currency,
        includesVat: Boolean(offer.includesVat),
        variants: offer.variants ?? [],
      })),
      terms,
    )
    for (const item of plan.update) {
      if (!item.changed) continue
      await payload.update({ collection: 'offers', id: item.id, data: item.data, ...opts })
      changed++
    }
    for (const item of plan.create) {
      await payload.create({
        collection: 'offers',
        data: {
          title: `${product.title} — ${item.configuration}`,
          status: 'published',
          product: product.id,
          configuration: item.configuration,
          license: item.license,
          ...item.data,
        },
        ...opts,
      })
      created++
    }
    const line = Object.entries(terms)
      .map(([term, amount]) => `${term} — ${kzt(amount)}`)
      .join(', ')
    const rest = plan.untouched ? `; других предложений не тронуто: ${plan.untouched}` : ''
    report.push(`${product.title}: ${line}${rest}`)
  }
  for (const [slug, reason] of Object.entries(AUTODESK_NO_PRICE)) {
    const product = products.find((item) => item.slug === slug)
    if (product) report.push(`${product.title}: по запросу — ${reason}`)
  }
  await logActivity(payload, {
    action: 'prices',
    summary: `Цены Autodesk из прайс-листа: изменено ${changed}, добавлено ${created}`,
    userId,
    link: '/admin/prices',
    details: { report },
  })
  return [`изменено предложений ${changed}, добавлено ${created}`, ...report]
}
