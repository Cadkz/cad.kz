import Link from 'next/link'
import type { NewsCardData } from '../NewsCard/NewsCard'
import styles from './RelatedList.module.css'

/** Короткий список ссылок под текстом шаблона «Чтение» (страницы «О компании»). */
export function RelatedList({ title, items }: { title: string; items: NewsCardData[] }) {
  if (!items.length) return null
  return (
    <nav className={styles.box} aria-label={title}>
      <p className={styles.title}>{title}</p>
      <ul className={styles.list}>
        {items.map((item) => (
          <li key={item.id}>
            <Link href={item.href} className={styles.link}>
              {item.title}
            </Link>
            {item.date && <span className={styles.date}>{item.date}</span>}
          </li>
        ))}
      </ul>
    </nav>
  )
}
