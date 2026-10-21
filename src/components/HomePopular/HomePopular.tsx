import { ArrowRight } from 'lucide-react'
import Link from 'next/link'
import type { PopularCardData } from '@/lib/popular'
import { PopularCard } from '../PopularCard/PopularCard'
import styles from './HomePopular.module.css'

type Props = { cards: PopularCardData[] }

/**
 * «Популярные решения» на главной вместо каталога с фильтром (аудит 21.10.2026: каталог занимал
 * 5 экранов телефона и повторял меню и /catalog). Те же плитки, что в меню «Каталог»: две в ряд
 * на телефоне, четыре от 640 px, все в один ряд от 1200 px. Под плитками — продление лицензии:
 * второй частый повод прийти на сайт.
 */
export function HomePopular({ cards }: Props) {
  if (!cards.length) return null
  return (
    <div className={styles.root}>
      <ul className={styles.grid}>
        {cards.map((card) => (
          <li key={card.key}>
            <PopularCard card={card} />
          </li>
        ))}
      </ul>
      <Link href="/renew" className={styles.renew}>
        Уже есть лицензия? Продлить
        <ArrowRight size={16} strokeWidth={1.75} aria-hidden="true" />
      </Link>
    </div>
  )
}
