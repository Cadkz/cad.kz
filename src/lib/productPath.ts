import type { Product } from '../../payload-types'
import legacyCatalog from '../domain/legacyCatalog.json'
import { catalogPath, cleanPath, parseCatalogPath, pathVariants } from '../domain/legacyRoutes.mjs'

/** Код товара на старом сайте → код его раздела (из карт сайта cad.kz, scripts/legacy-sitemap.mjs). */
export const legacySections: Record<string, string> = legacyCatalog.products

/**
 * Адрес страницы товара. Если товар был на старом сайте, адрес остаётся прежним
 * (/catalog/<раздел>/<код>/), чтобы не терять позиции в поиске; иначе — /products/<код>.
 */
export function productPath(product: Pick<Product, 'slug' | 'legacyUrl'>) {
  if (product.legacyUrl) {
    const path = cleanPath(product.legacyUrl.replace(/^https?:\/\/[^/]+/i, ''))
    if (parseCatalogPath(path)?.code) return pathVariants(path)[1]
  }
  const section = Object.hasOwn(legacySections, product.slug) ? legacySections[product.slug] : null
  return section ? catalogPath(section, product.slug) : `/products/${product.slug}`
}
