'use client'

import { ArrowLeft, ArrowRight } from 'lucide-react'
import { useT } from '@/components/LangProvider/LangProvider'
import { pageWindow } from '@/lib/pagination'
import styles from './Pagination.module.css'

type Props = { page: number; pages: number; onPage: (page: number) => void }

/**
 * «Назад», номера страниц (первая, последняя и соседние с текущей, пропуски — «…») и «Далее».
 * Текущая страница отмечена aria-current.
 */
export function Pagination({ page, pages, onPage }: Props) {
  const t = useT()
  if (pages < 2) return null
  return (
    <nav className={styles.pagination} aria-label={t('Страницы каталога')}>
      {page > 1 && (
        <button
          type="button"
          className={`${styles.page} ${styles.next}`}
          aria-label={t('Предыдущая страница')}
          onClick={() => onPage(page - 1)}
        >
          <ArrowLeft size={16} strokeWidth={1.75} aria-hidden="true" />
        </button>
      )}
      {pageWindow(page, pages, 1).map((n, i) =>
        n === null ? (
          // biome-ignore lint/suspicious/noArrayIndexKey: пропуск «…» стоит на своём месте в ряду
          <span key={`gap-${i}`} className={styles.gap} aria-hidden="true">
            …
          </span>
        ) : (
          <button
            key={n}
            type="button"
            className={styles.page}
            aria-current={n === page ? 'page' : undefined}
            aria-label={t('Страница {n}', { n })}
            onClick={() => onPage(n)}
          >
            {n}
          </button>
        ),
      )}
      {page < pages && (
        <button
          type="button"
          className={`${styles.page} ${styles.next}`}
          onClick={() => onPage(page + 1)}
        >
          {t('Далее')}
          <ArrowRight size={16} strokeWidth={1.75} aria-hidden="true" />
        </button>
      )}
    </nav>
  )
}
