import type { PopularCardData } from '@/lib/popular'
import { PopularCard } from '../PopularCard/PopularCard'
import styles from './PopularRow.module.css'

/**
 * «Популярные решения» на главной: от 1200 px все плитки в один ряд (замечание владельца
 * 13.10.2026, вечер), ниже — по четыре в ряд, на телефоне по две.
 */
export function PopularRow({ cards }: { cards: PopularCardData[] }) {
  return (
    <ul className={styles.row}>
      {cards.map((card) => (
        <li key={card.key}>
          <PopularCard card={card} />
        </li>
      ))}
    </ul>
  )
}
