import { ChevronRight } from 'lucide-react'
import Link from 'next/link'
import styles from './Breadcrumbs.module.css'

type Crumb = { title: string; href?: string }

/** Хлебные крошки. Последний пункт — текущая страница, без ссылки. */
export function Breadcrumbs({ items }: { items: Crumb[] }) {
  return (
    <nav aria-label="Хлебные крошки" className={styles.nav}>
      <ol className={styles.list}>
        {items.map((item, i) => (
          <li key={`${item.title}-${i}`} className={styles.item}>
            {i > 0 && (
              <ChevronRight
                size={16}
                strokeWidth={1.75}
                aria-hidden="true"
                className={styles.sep}
              />
            )}
            {item.href ? (
              <Link href={item.href} className={styles.link}>
                {item.title}
              </Link>
            ) : (
              <span aria-current="page">{item.title}</span>
            )}
          </li>
        ))}
      </ol>
    </nav>
  )
}
