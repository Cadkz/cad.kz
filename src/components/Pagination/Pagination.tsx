'use client'

import { ArrowRight } from 'lucide-react'
import styles from './Pagination.module.css'

type Props = { page: number; pages: number; onPage: (page: number) => void }

/** Номера страниц и «Далее». Текущая страница отмечена aria-current. */
export function Pagination({ page, pages, onPage }: Props) {
  if (pages < 2) return null
  return (
    <nav className={styles.pagination} aria-label="Страницы каталога">
      {Array.from({ length: pages }, (_, i) => i + 1).map((n) => (
        <button
          key={n}
          type="button"
          className={styles.page}
          aria-current={n === page ? 'page' : undefined}
          aria-label={`Страница ${n}`}
          onClick={() => onPage(n)}
        >
          {n}
        </button>
      ))}
      {page < pages && (
        <button
          type="button"
          className={`${styles.page} ${styles.next}`}
          onClick={() => onPage(page + 1)}
        >
          Далее
          <ArrowRight size={16} strokeWidth={1.75} aria-hidden="true" />
        </button>
      )}
    </nav>
  )
}
