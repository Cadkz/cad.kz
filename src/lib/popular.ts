import { brandOf } from '@/domain/brands.mjs'
import type { CatalogItem } from './catalog'
import type { Home } from './home'
import type { Picture } from './pictures'

export type PopularCardData = {
  key: string
  title: string
  href: string
  picture: Picture | null
  icon: string | null
  /** Фирменный вид: ключ цвета и логотип программы (по названию плитки). */
  brand: { key: string; logo: string } | null
}

/**
 * Плитки «Популярных решений» (первая вкладка меню «Каталог»): маленький логотип с товара (тот же набор, что
 * в каталоге) и название. Своя ссылка из админки важнее ссылки товара: «Inventor и Fusion»
 * ведёт в каталог, а не на один Inventor. Без товара и без ссылки плитка не показывается.
 */
export function popularCards(
  items: Home['popular']['items'],
  catalog: Pick<CatalogItem, 'id' | 'href' | 'title' | 'picture' | 'icon'>[],
): PopularCardData[] {
  const byId = new Map(catalog.filter((item) => item.id > 0).map((item) => [item.id, item]))
  return items.flatMap((item) => {
    const product = item.productId == null ? undefined : byId.get(item.productId)
    const href = item.href || product?.href
    const title = item.title || product?.title
    if (!href || !title) return []
    return [
      {
        key: String(item.key),
        title,
        href,
        picture: product?.picture ?? null,
        icon: product?.icon ?? null,
        brand: brandFor(title),
      },
    ]
  })
}

function brandFor(title: string): PopularCardData['brand'] {
  const brand = brandOf(title)
  return brand ? { key: brand.key, logo: brand.logo } : null
}
