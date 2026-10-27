import { ArrowRight } from 'lucide-react'
import Link from 'next/link'
import type { MenuLogo } from '@/lib/navigation'
import { catalogHref } from '@/lib/navigationHrefs'
import type { PopularCardData } from '@/lib/popular'
import { MenuTile } from '../MenuTile/MenuTile'
import { PopularCard } from '../PopularCard/PopularCard'
import styles from './MenuPopular.module.css'

type Props = {
  cards: PopularCardData[]
  onNavigate: () => void
  /** В меню телефона: без своих полей и подписи — их даёт раскрывающаяся строка. */
  compact?: boolean
}

/** Знак плитки: фирменный логотип программы, иначе картинка товара. */
const logoOf = (card: PopularCardData): MenuLogo | null =>
  card.brand
    ? { url: card.brand.logo, width: 48, height: 48, local: true }
    : card.picture
      ? {
          url: card.picture.url,
          width: card.picture.width,
          height: card.picture.height,
          local: card.picture.local,
        }
      : null

/**
 * «Популярные решения» — первая вкладка меню «Каталог» (решение владельца 16.10.2026, раньше —
 * блок на главной), ниже ссылка на весь каталог. В мегаменю — те же карточки MenuTile, что
 * у производителей и линеек (просьба владельца 27.10.2026: один размер и вид во всём меню);
 * в меню телефона — прежние плитки.
 */
export function MenuPopular({ cards, onNavigate, compact = false }: Props) {
  return (
    <div className={compact ? styles.compact : styles.root}>
      {!compact && <p className={styles.lead}>Чаще всего выбирают</p>}
      <ul className={compact ? styles.grid : styles.tiles}>
        {cards.map((card) => (
          <li key={card.key}>
            {compact ? (
              <PopularCard card={card} onNavigate={onNavigate} />
            ) : (
              <MenuTile
                title={card.title}
                logo={logoOf(card)}
                icon={card.icon}
                href={card.href}
                onClick={onNavigate}
              />
            )}
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
