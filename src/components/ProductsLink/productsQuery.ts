import type { Where } from 'payload'

/** По чему открываем товары: производитель, линейка или раздел. */
export type ProductsBy = 'manufacturer' | 'line' | 'section'

export function isProductsBy(value: unknown): value is ProductsBy {
  return value === 'manufacturer' || value === 'line' || value === 'section'
}

/** Условие отбора товаров. Раздел — основной или дополнительный. */
export function productsWhere(by: ProductsBy, id: number | string): Where {
  if (by === 'section') {
    return { or: [{ mainSection: { equals: id } }, { extraSections: { in: [id] } }] }
  }
  return { [by]: { equals: id } }
}

/**
 * Адрес списка «Товары» с уже включённым фильтром. Формат «or → and» — тот, что строит
 * сам фильтр списка, поэтому условие видно и в панели «Фильтры», его можно снять.
 */
export function productsListUrl(by: ProductsBy, id: number | string): string {
  const value = encodeURIComponent(String(id))
  if (by === 'section') {
    return (
      '/admin/collections/products?limit=100' +
      `&where[or][0][and][0][mainSection][equals]=${value}` +
      `&where[or][1][and][0][extraSections][in][0]=${value}`
    )
  }
  return `/admin/collections/products?limit=100&where[or][0][and][0][${by}][equals]=${value}`
}
