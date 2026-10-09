import type { ReactNode } from 'react'
import styles from './ReadingLayout.module.css'

/**
 * Шаблон «Чтение»: текст слева (8 колонок, строка не шире --measure),
 * справа 4 колонки — оглавление и связанные материалы, липкие. На телефоне одна колонка.
 */
export function ReadingLayout({ children, aside }: { children: ReactNode; aside: ReactNode }) {
  return (
    <div className={styles.layout}>
      <article className={styles.main}>{children}</article>
      <aside className={styles.aside}>
        <div className={styles.sticky}>{aside}</div>
      </aside>
    </div>
  )
}
