import { cache } from 'react'
import type { HomePage } from '../../payload-types'
import { cms } from './payload'
import { cardPictures } from './pictures'
import { type PopularCardData, popularCards } from './popular'
import { productPath } from './productPath'
import { relId, relIds } from './rel'

/**
 * «Популярные решения» для меню «Каталог» (решение владельца 16.10.2026: блок переехал с главной
 * в меню, первой вкладкой). Список плиток — в админке: «Главная» → «Блок „Популярные решения“».
 * Читаются только товары плиток, а не весь каталог: меню есть на каждой странице.
 */
export const getMenuPopular = cache(async (): Promise<PopularCardData[]> => {
  const payload = await cms()
  const page = (await payload.findGlobal({ slug: 'home-page', depth: 0 })) as HomePage
  const items = (page.popular?.items ?? []).map((item) => ({
    key: item.id ?? `${item.title}-${item.href}`,
    productId: relId(item.product),
    title: item.title ?? null,
    href: item.href ?? null,
  }))
  const ids = items.flatMap((item) => (item.productId == null ? [] : [item.productId]))
  if (!ids.length) return popularCards(items, [])

  const { docs: products } = await payload.find({
    collection: 'products',
    where: { and: [{ id: { in: ids } }, { status: { equals: 'published' } }] },
    pagination: false,
    depth: 0,
    select: {
      title: true,
      slug: true,
      legacyUrl: true,
      gallery: true,
      manufacturer: true,
      mainSection: true,
    },
  })
  const vendorIds = [...new Set(relIds(products.map((product) => product.manufacturer)))]
  const sectionIds = [...new Set(relIds(products.map((product) => product.mainSection)))]
  const [vendors, sections] = await Promise.all([
    payload.find({
      collection: 'manufacturers',
      where: { id: { in: vendorIds } },
      pagination: false,
      depth: 0,
      select: { title: true, image: true },
    }),
    payload.find({
      collection: 'sections',
      where: { id: { in: sectionIds } },
      pagination: false,
      depth: 0,
      select: { icon: true },
    }),
  ])
  const pictures = await cardPictures(payload, products, vendors.docs)
  const iconById = new Map(sections.docs.map((section) => [section.id, section.icon ?? null]))
  return popularCards(
    items,
    products.map((product) => ({
      id: product.id,
      href: productPath(product),
      title: product.title,
      picture: pictures.get(product.id) ?? null,
      icon: iconById.get(relId(product.mainSection) ?? -1) ?? null,
    })),
  )
})
