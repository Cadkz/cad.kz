import { ArrowRight } from 'lucide-react'
import Link from 'next/link'
import type { ReactNode } from 'react'
import styles from './MenuPanel.module.css'

type FooterLink = { href: string; label: string }

type Props = {
  title: string
  /** Карточки — элементы списка <li>. */
  children: ReactNode
  /** Строка ссылок под карточками: производители раздела. */
  links?: { caption: string; items: { title: string; href: string }[] }
  footer: FooterLink[]
  /** Колонок карточек от 960 px. */
  columns?: 2 | 3
  onNavigate: () => void
}

/**
 * Правая часть мегаменю: заголовок, карточки, строка ссылок и переходы в каталог.
 * Светлая чертёжная сетка растворяется к краям. Без анимации: смена раздела мгновенная.
 */
export function MenuPanel({ title, children, links, footer, columns = 2, onNavigate }: Props) {
  return (
    <div className={styles.root}>
      <p className={styles.title}>{title}</p>
      <ul className={columns === 3 ? `${styles.cards} ${styles.three}` : styles.cards}>
        {children}
      </ul>
      {links && links.items.length > 0 && (
        <p className={styles.links}>
          <span className={styles.caption}>{links.caption}</span>
          {links.items.map((item) => (
            <Link key={item.href} href={item.href} className={styles.link} onClick={onNavigate}>
              {item.title}
            </Link>
          ))}
        </p>
      )}
      <div className={styles.footer}>
        {footer.map((item) => (
          <Link key={item.href} href={item.href} className={styles.all} onClick={onNavigate}>
            {item.label}
            <ArrowRight size={16} strokeWidth={1.75} aria-hidden="true" />
          </Link>
        ))}
      </div>
    </div>
  )
}
