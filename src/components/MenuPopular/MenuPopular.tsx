import { ArrowRight } from 'lucide-react'
import Link from 'next/link'
import { catalogHref } from '@/lib/navigationHrefs'
import type { PopularCardData } from '@/lib/popular'
import { CatalogEntry } from '../CatalogEntry/CatalogEntry'
import styles from './MenuPopular.module.css'

type Props = {
  cards: PopularCardData[]
  onNavigate: () => void
  /** В меню телефона: без своих полей и подписи — их даёт раскрывающаяся строка. */
  compact?: boolean
}

/**
 * «Популярные решения» — первая вкладка меню «Каталог» (решение владельца 16.10.2026, раньше —
 * блок на главной): плитки с логотипом и названием, ниже ссылка на весь каталог.
 */
export function MenuPopular({ cards, onNavigate, compact = false }: Props) {
  return (
    <div className={compact ? styles.compact : styles.root}>
      {!compact && <p className={styles.lead}>Чаще всего выбирают</p>}
      <ul className={styles.grid}>
        {cards.map((card) => (
          <li key={card.key}>
            {card.product && <CatalogEntry product={card.product} onNavigate={onNavigate} />}
          </li>
        ))}
      </ul>
      <Link href={catalogHref()} className={styles.all} onClick={onNavigate}>
        Весь каталог
        <ArrowRight size={16} strokeWidth={1.75} aria-hidden="true" />
      </Link>
    </div>
  )
}
