import type { Payload } from 'payload'
import type { HomePage } from '../../payload-types'
import { CRM_POPULAR, CRM_RENEW_BAND } from '../domain/crmCatalogSeed.mjs'

const opts = { overrideAccess: true, depth: 0 } as const

/** Товар для карточки: по адресу, иначе по началу названия среди опубликованных. */
async function findProduct(payload: Payload, slug: string | null, title: RegExp | null) {
  if (slug) {
    const { docs } = await payload.find({
      collection: 'products',
      where: { and: [{ slug: { equals: slug } }, { status: { equals: 'published' } }] },
      limit: 1,
      ...opts,
    })
    if (docs[0]) return docs[0].id
  }
  if (!title) return null
  const { docs } = await payload.find({
    collection: 'products',
    where: { status: { equals: 'published' } },
    pagination: false,
    select: { title: true },
    ...opts,
  })
  return docs.find((doc) => title.test(doc.title.trim()))?.id ?? null
}

/**
 * Главная по CRM: «Популярные решения» (если блок пуст) и полоса «Продление лицензий»
 * (если у неё нет заголовка). Правленное в админке не трогаем.
 */
export async function setupCrmHome(payload: Payload): Promise<string[]> {
  const report: string[] = []
  const page: HomePage = await payload.findGlobal({ slug: 'home-page', ...opts })
  const data: Partial<HomePage> = {}
  if (!page.popular?.items?.length) {
    const items: NonNullable<NonNullable<HomePage['popular']>['items']> = []
    for (const card of CRM_POPULAR) {
      const product = await findProduct(payload, card.slug, card.title)
      if (!product) report.push(`Популярные решения: не найден товар для «${card.label}»`)
      items.push({
        product,
        title: card.label,
        text: card.text,
        buttonLabel: card.button,
        // Без товара карточка ведёт в каталог.
        href: product ? null : '/catalog',
      })
    }
    data.popular = {
      title: page.popular?.title || 'Популярные решения',
      lead: page.popular?.lead || 'С чего чаще всего начинают наши клиенты.',
      items,
    }
    report.push(`Популярные решения: ${items.length} карточек`)
  }
  if (!page.renew?.title) {
    data.renew = { title: CRM_RENEW_BAND.title, text: CRM_RENEW_BAND.text }
    report.push('Полоса «Продление лицензий» на главной')
  }
  if (Object.keys(data).length) await payload.updateGlobal({ slug: 'home-page', data, ...opts })
  return report
}
