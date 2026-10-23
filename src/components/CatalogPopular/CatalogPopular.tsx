import type { PopularCardData } from '@/lib/popular'
import { PopularCard } from '../PopularCard/PopularCard'
import styles from './CatalogPopular.module.css'

/**
 * Вкладка «Популярные решения» на странице каталога — те же плитки, что первая вкладка меню
 * «Каталог» (решение владельца 23.10.2026). Список — в админке: «Главная» → «Популярные решения».
 */
export function CatalogPopular({ cards }: { cards: PopularCardData[] }) {
  return (
    <ul className={styles.grid} aria-label="Популярные решения">
      {cards.map((card) => (
        <li key={card.key}>
          <PopularCard card={card} />
        </li>
      ))}
    </ul>
  )
}
