import type { CatalogItem } from './catalog'
import type { Home } from './home'
import type { Picture } from './pictures'

export type PopularCardData = {
  key: string
  title: string
  href: string
  picture: Picture | null
  icon: string | null
}

/**
 * Плитки «Популярных решений» на главной: маленький логотип с товара (тот же набор, что
 * в каталоге) и название. Своя ссылка из админки важнее ссылки товара: «Inventor и Fusion»
 * ведёт в каталог, а не на один Inventor. Без товара и без ссылки плитка не показывается.
 */
export function popularCards(
  items: Home['popular']['items'],
  catalog: CatalogItem[],
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
      },
    ]
  })
}
