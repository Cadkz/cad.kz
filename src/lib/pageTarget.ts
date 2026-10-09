import type { Payload } from 'payload'
import { catalogHref } from './navigationHrefs'
import { productPath } from './productPath'
import { relId } from './rel'

/**
 * Куда ведёт адрес товара без своей страницы: на страницу его семейства (к его строке),
 * иначе на товар с подбором, где он — вариант (уже выбранным), иначе в каталог производителя.
 */
export async function noPageTarget(
  payload: Payload,
  product: { id: number; slug: string; lineId: number | null; vendorId: number | null },
): Promise<string> {
  const { lineId, vendorId } = product
  if (lineId != null) {
    const { docs } = await payload.find({
      collection: 'product-lines',
      where: {
        and: [
          { id: { equals: lineId } },
          { status: { equals: 'published' } },
          { familyPage: { equals: true } },
        ],
      },
      limit: 1,
      depth: 0,
    })
    if (docs[0]?.slug) return `/families/${docs[0].slug}#${product.slug}`
  }
  const parents = await payload.find({
    collection: 'products',
    where: { and: [{ status: { equals: 'published' } }, { pageView: { equals: 'picker' } }] },
    pagination: false,
    depth: 0,
    select: { slug: true, legacyUrl: true, picker: true },
  })
  const parent = parents.docs.find((doc) =>
    (doc.picker?.steps ?? []).some((step) =>
      (step.items ?? []).some((item) => relId(item.product) === product.id),
    ),
  )
  if (parent) return `${productPath(parent)}?pick=${product.id}`
  if (vendorId != null) {
    const vendor = await payload.findByID({
      collection: 'manufacturers',
      id: vendorId,
      depth: 0,
      disableErrors: true,
    })
    if (vendor) return catalogHref({ vendor: vendor.title })
  }
  return catalogHref()
}
