import type { Metadata } from 'next'
import type { Product, Section } from '../../payload-types'
import type { PickerView } from '../domain/picker.mjs'
import { formatKzt } from './format'
import { cms } from './payload'
import { loadPicker } from './picker'
import { type Picture, productPictures } from './pictures'
import { loadPricingContext, quoteOffer } from './pricing'
import { productPath } from './productPath'
import { relId } from './rel'
import { pageMetadata } from './seo'

/** Служебные характеристики: в базе нужны для прайсов и 1С, покупателю не показываются. */
const HIDDEN_PROPERTIES = new Set(['артикул'])

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
  offers: ProductOffer[]
  /** Вид страницы: обычная, с подбором или без своей страницы (тогда адрес перенаправляется). */
  pageView: Product['pageView']
  /** Подбор комплекта; у обычной страницы — один шаг из своих предложений. */
  picker: PickerView
  renewLabel: string | null
  /** Линейка и производитель: куда вести адрес товара без своей страницы. */
  lineId: number | null
  vendorId: number | null
  /** Своя галерея или картинка производителя; пусто — блока картинок нет. */
  pictures: Picture[]
  seo: Product['seo']
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
  const [offers, context, picker] = await Promise.all([
    payload.find({
      collection: 'offers',
      where: { and: [{ status: { equals: 'published' } }, { product: { equals: product.id } }] },
      limit: 100,
      depth: 0,
    }),
    loadPricingContext(payload),
    loadPicker(payload, product),
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
    properties: (product.properties ?? [])
      .filter(({ name }) => !HIDDEN_PROPERTIES.has(name.trim().toLowerCase()))
      .map(({ name, value }) => ({ name, value })),
    faq: (product.faq ?? []).map(({ question, answer }) => ({ question, answer })),
    requires: related(product.requiresProducts),
    offers: priced.map(({ offer, unit }) => ({
      id: String(offer.id),
      configuration: offer.configuration,
      license: offer.license,
      price: unit ? formatKzt(unit) : null,
    })),
    pageView: product.pageView ?? 'standard',
    picker,
    renewLabel: product.renewLabel || null,
    lineId: relId(product.line),
    vendorId: relId(product.manufacturer),
    pictures: productPictures(product),
    seo: product.seo,
  }
}

/** Заголовок, описание и канонический адрес страницы товара. Перенесённые со старого сайта — первыми. */
export function productMetadata(product: ProductPage): Metadata {
  return pageMetadata({
    seo: product.seo,
    title: `${product.title} — купить в CAD.kz`,
    description: product.summary ?? product.description,
    path: product.path,
    image: product.pictures[0]?.url,
  })
}

/** Товар из адреса ?pick=ID: старый адрес варианта ведёт на подбор с уже выбранным вариантом. */
export function pickParam(value: string | string[] | undefined): number | null {
  const id = Number(Array.isArray(value) ? value[0] : value)
  return Number.isSafeInteger(id) && id > 0 ? id : null
}
