import Link from '@/components/LangLink/LangLink'
import { getT } from '@/i18n/server'
import { formatDate } from '@/lib/format'
import type { NewsCardData } from '../NewsCard/NewsCard'
import styles from './RelatedList.module.css'

type Props = {
  title: string
  items: NewsCardData[]
  /** Адрес открытой страницы: пункт остаётся на своём месте и подсвечен, список не прыгает. */
  current?: string
}

/** Связанные материалы в правой колонке шаблона «Чтение». */
export async function RelatedList({ title, items, current }: Props) {
  const t = await getT()
  if (!items.length) return null
  return (
    <nav className={styles.box} aria-label={title}>
      <p className={styles.title}>{t(title)}</p>
      <ul className={styles.list}>
        {items.map((item) => (
          <li key={item.id}>
            <Link
              href={item.href}
              className={styles.link}
              aria-current={item.href === current ? 'page' : undefined}
            >
              {item.title}
            </Link>
            {item.date && <span className={styles.date}>{formatDate(item.date, t.lang)}</span>}
          </li>
        ))}
      </ul>
    </nav>
  )
}
