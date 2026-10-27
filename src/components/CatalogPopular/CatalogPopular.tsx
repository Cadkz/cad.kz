import type { PopularCardData } from '@/lib/popular'
import { ProductCard, type ProductCardData } from '../ProductCard/ProductCard'
import styles from './CatalogPopular.module.css'

/**
 * Карточка плитки: у товара — его карточка каталога (цена, корзина), название — как в админке.
 * Плитка со своей ссылкой («3D-сканеры Artec» ведёт в раздел) — та же карточка без цены и корзины.
 */
function toCard(
  card: PopularCardData,
  byId: Map<number, ProductCardData>,
  byHref: Map<string, ProductCardData>,
): ProductCardData {
  const item =
    (card.productId == null ? undefined : byId.get(card.productId)) ?? byHref.get(card.href)
  if (item && item.href === card.href) return { ...item, title: card.title }
  return {
    id: -1,
    href: card.href,
    title: card.title,
    manufacturer: item?.manufacturer ?? null,
    summary: null,
    // Ссылка ведёт в раздел или подборку: описание одного товара сюда не подходит.
    cardText: 'Все модели и комплектации в каталоге',
    icon: card.icon,
    picture: card.brand
      ? { url: card.brand.logo, alt: '', width: 48, height: 48, fit: 'logo', local: true }
      : card.picture,
    priceFrom: null,
    offersCount: 0,
    cartOfferId: null,
    badge: null,
    linkOnly: true,
  }
}

/**
 * Вкладка «Популярные решения» на странице каталога: полноценные карточки того же размера, что
 * во всём каталоге (просьба владельца 27.10.2026, раньше — мелкие плитки). Список — в админке:
 * «Главная» → «Популярные решения».
 */
export function CatalogPopular({
  cards,
  items,
}: {
  cards: PopularCardData[]
  items: ProductCardData[]
}) {
  const byId = new Map(items.filter((item) => item.id > 0).map((item) => [item.id, item]))
  const byHref = new Map(items.map((item) => [item.href, item]))
  return (
    <ul className={styles.grid} aria-label="Популярные решения">
      {cards.map((card) => (
        <li key={card.key}>
          <ProductCard product={toCard(card, byId, byHref)} />
        </li>
      ))}
    </ul>
  )
}
