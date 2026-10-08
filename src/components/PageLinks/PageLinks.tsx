import Link from 'next/link'
import styles from './PageLinks.module.css'

type Props = { page: number; pages: number; hrefFor: (page: number) => string }

/** Страницы списка ссылками (серверная пагинация). */
export function PageLinks({ page, pages, hrefFor }: Props) {
  if (pages < 2) return null
  return (
    <nav aria-label="Страницы" className={styles.list}>
      {Array.from({ length: pages }, (_, i) => i + 1).map((n) => (
        <Link
          key={n}
          href={hrefFor(n)}
          className={styles.page}
          aria-current={n === page ? 'page' : undefined}
        >
          {n}
        </Link>
      ))}
    </nav>
  )
}
