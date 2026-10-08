import type { Metadata } from 'next'
import type { Product, Section } from '../../payload-types'
import { formatKzt } from './format'
import { cms } from './payload'
import { loadPricingContext, quoteOffer } from './pricing'
import { productPath } from './productPath'

export type ProductOffer = {
  id: string
  configuration: string
  license: string
  /** Цена за единицу, рассчитанная сервером, или null, если курс не задан. */
  price: string | null
}

export type RelatedProduct = { slug: string; href: string; title: string; vendor: string | null }

export type ProductPage = {
  id: number
  slug: string
  /** Адрес страницы: прежний адрес cad.kz, если товар там был. */
  path: string
  title: string
  kind: Product['kind']
  summary: string | null
  description: string | null
  vendor: string | null
  sections: { slug: string; title: string; isDirection: boolean; icon: string | null }[]
  tasks: string[]
  properties: { name: string; value: string }[]
  faq: { question: string; answer: string }[]
  requires: RelatedProduct[]
  recommended: RelatedProduct[]
  offers: ProductOffer[]
}

function related(value: Product['recommended']): RelatedProduct[] {
  return (value ?? [])
    .filter((item): item is Product => typeof item !== 'number' && item.status === 'published')
    .map((item) => ({
      slug: item.slug,
      href: productPath(item),
      title: item.title,
      vendor:
        item.manufacturer && typeof item.manufacturer !== 'number' ? item.manufacturer.title : null,
    }))
}

/** Товар для полной страницы: предложения с серверной ценой, связи, характеристики. */
export async function getProduct(slug: string): Promise<ProductPage | null> {
  const payload = await cms()
  const { docs } = await payload.find({
    collection: 'products',
    where: { and: [{ status: { equals: 'published' } }, { slug: { equals: slug } }] },
    limit: 1,
    depth: 2,
  })
  const product = docs[0]
  if (!product) return null
  const [offers, context] = await Promise.all([
    payload.find({
      collection: 'offers',
      where: { and: [{ status: { equals: 'published' } }, { product: { equals: product.id } }] },
      limit: 100,
      depth: 0,
    }),
    loadPricingContext(payload),
  ])
  const priced = offers.docs
    .map((offer) => {
      let unit: string | null = null
      try {
        unit = quoteOffer(offer, context).unitKzt
      } catch {
        unit = null
      }
      return { offer, unit }
    })
    .sort((a, b) => Number(BigInt(a.unit ?? '0') - BigInt(b.unit ?? '0')))

  return {
    id: product.id,
    slug: product.slug,
    path: productPath(product),
    title: product.title,
    kind: product.kind,
    summary: product.summary ?? null,
    description: product.description ?? null,
    vendor:
      product.manufacturer && typeof product.manufacturer !== 'number'
        ? product.manufacturer.title
        : null,
    sections: (product.sections ?? [])
      .filter((section): section is Section => typeof section !== 'number')
      .map((section) => ({
        slug: section.slug,
        title: section.title,
        isDirection: Boolean(section.isDirection),
        icon: section.icon ?? null,
      })),
    tasks: (product.tasks ?? []).map((task) => task.title),
    properties: (product.properties ?? []).map(({ name, value }) => ({ name, value })),
    faq: (product.faq ?? []).map(({ question, answer }) => ({ question, answer })),
    requires: related(product.requiresProducts),
    recommended: related(product.recommended),
    offers: priced.map(({ offer, unit }) => ({
      id: String(offer.id),
      configuration: offer.configuration,
      license: offer.license,
      price: unit ? formatKzt(unit) : null,
    })),
  }
}

/** Похожие товары — из тех же направлений, без самого товара и уже рекомендованных. */
export async function getSimilar(product: ProductPage, limit = 3): Promise<RelatedProduct[]> {
  const directions = product.sections.filter((s) => s.isDirection).map((s) => s.slug)
  if (!directions.length) return []
  const payload = await cms()
  const sections = await payload.find({
    collection: 'sections',
    where: { slug: { in: directions } },
    limit: 50,
    depth: 0,
  })
  const exclude = [product.slug, ...product.recommended.map((r) => r.slug)]
  const { docs } = await payload.find({
    collection: 'products',
    where: {
      and: [
        { status: { equals: 'published' } },
        { sections: { in: sections.docs.map((s) => s.id) } },
        { slug: { not_in: exclude } },
      ],
    },
    limit,
    depth: 1,
  })
  return related(docs)
}

/** Заголовок, описание и канонический адрес страницы товара. */
export function productMetadata(product: ProductPage): Metadata {
  return {
    title: `${product.title} — купить в CAD.kz`,
    description: product.summary ?? undefined,
    alternates: { canonical: product.path },
  }
}
