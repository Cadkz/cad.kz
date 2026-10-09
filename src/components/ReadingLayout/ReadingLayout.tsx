import type { ReactNode } from 'react'
import styles from './ReadingLayout.module.css'

/**
 * Шаблон «Чтение» (решение владельца 09.10.2026): текст одной колонкой по центру рамки
 * (8 из 12 колонок, абзацы не шире --measure). Связанные материалы — под текстом отдельной секцией.
 */
export function ReadingLayout({ children }: { children: ReactNode }) {
  return (
    <div className={styles.layout}>
      <article className={styles.main}>{children}</article>
    </div>
  )
}
