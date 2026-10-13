import { ArrowRight } from 'lucide-react'
import Link from 'next/link'
import type { ReactNode } from 'react'
import styles from './MenuPanel.module.css'

type FooterLink = { href: string; label: string }

type Props = {
  title: string
  /** Карточки — элементы списка <li>. */
  children: ReactNode
  footer: FooterLink[]
  onNavigate: () => void
}

/**
 * Правая часть мегаменю: заголовок, карточки и переходы в каталог.
 * Светлая чертёжная сетка растворяется к краям. Без анимации: смена раздела мгновенная.
 */
export function MenuPanel({ title, children, footer, onNavigate }: Props) {
  return (
    <div className={styles.root}>
      <p className={styles.title}>{title}</p>
      <ul className={styles.cards}>{children}</ul>
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
