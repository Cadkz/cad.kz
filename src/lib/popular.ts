import type { CatalogItem } from './catalog'
import type { Home } from './home'
import type { Picture } from './pictures'

export type PopularCardData = {
  key: string
  title: string
  text: string | null
  href: string
  picture: Picture | null
  icon: string | null
  price: string | null
  label: string
}

/**
 * Карточки «Популярных решений» на главной: название, картинка, цена «от» и кнопка — с товара
 * (тот же набор, что в каталоге), подписи из админки важнее. Карточка без товара и без ссылки,
 * как и снятый с публикации товар без своей ссылки, не показывается.
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
    const price = product
      ? product.priceFrom
        ? `${product.offersCount > 1 ? 'от ' : ''}${product.priceFrom}`
        : 'Цена по запросу'
      : null
    return [
      {
        key: String(item.key),
        title,
        text: item.text || product?.summary || null,
        href,
        picture: product?.picture ?? null,
        icon: product?.icon ?? null,
        price,
        label: item.buttonLabel || product?.actionLabel || 'Подробнее',
      },
    ]
  })
}
