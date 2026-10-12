import { ArrowRight } from 'lucide-react'
import Link from 'next/link'
import type { NewsCardData } from '../NewsCard/NewsCard'
import styles from './NewsLine.module.css'

/**
 * Новости на главной — лента без обложек: дата и тема, заголовок, стрелка, тонкая линия сверху.
 * От 960 px три равные колонки, на телефоне — список. Страница «Новости» по-прежнему
 * показывает карточки (NewsCard).
 */
export function NewsLine({ items }: { items: NewsCardData[] }) {
  return (
    <ul className={styles.list}>
      {items.map((item) => (
        <li key={item.id} className={styles.item}>
          <div className={styles.meta}>
            {item.date && <time dateTime={item.date}>{item.date}</time>}
            {item.topic && <span className={styles.topic}>{item.topic}</span>}
          </div>
          <h3 className={styles.title}>
            <Link href={item.href} className={styles.link}>
              {item.title}
            </Link>
          </h3>
          <ArrowRight size={20} strokeWidth={1.75} aria-hidden="true" className={styles.arrow} />
        </li>
      ))}
    </ul>
  )
}
