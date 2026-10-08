import type { ReactNode } from 'react'
import styles from './ProductLayout.module.css'

type Props = { header: ReactNode; aside: ReactNode; children: ReactNode }

/**
 * Шаблон «Товар»: от 960 px — заголовок и содержимое на 8 колонок, блок покупки на 4, липкий.
 * На телефоне блок покупки идёт сразу после заголовка.
 */
export function ProductLayout({ header, aside, children }: Props) {
  return (
    <div className={styles.layout}>
      <div className={styles.header}>{header}</div>
      <aside className={styles.aside} aria-label="Покупка">
        <div className={styles.sticky}>{aside}</div>
      </aside>
      <div className={styles.body}>{children}</div>
    </div>
  )
}
