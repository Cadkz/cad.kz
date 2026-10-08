import { ArrowRight } from 'lucide-react'
import Link from 'next/link'
import styles from './ProductLinkCard.module.css'

type Props = { href: string; title: string; vendor: string | null }

const initials = (title: string) =>
  title
    .replace(/[«»"()]/g, '')
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((word) => word[0])
    .join('')
    .toUpperCase()

/** Компактная карточка-ссылка для блоков «С этим покупают» и «Похожие товары». */
export function ProductLinkCard({ href, title, vendor }: Props) {
  return (
    <Link href={href} className={styles.card}>
      <span className={styles.mark} aria-hidden="true">
        {initials(title)}
      </span>
      <span className={styles.title}>{title}</span>
      {vendor && <span className={styles.vendor}>{vendor}</span>}
      <span className={styles.more}>
        Смотреть
        <ArrowRight size={16} strokeWidth={1.75} aria-hidden="true" />
      </span>
    </Link>
  )
}
