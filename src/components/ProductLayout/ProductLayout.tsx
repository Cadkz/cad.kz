import type { ReactNode } from 'react'
import styles from './ProductLayout.module.css'

type Props = {
  header: ReactNode
  aside: ReactNode
  children: ReactNode
  /** На телефоне блок покупки после содержимого: сначала подбор по шагам, потом итог. */
  asideLast?: boolean
}

/**
 * Шаблон «Товар»: от 960 px — заголовок и содержимое на 8 колонок, блок покупки на 4, липкий.
 * На телефоне блок покупки идёт сразу после заголовка.
 */
export function ProductLayout({ header, aside, children, asideLast = false }: Props) {
  return (
    <div className={styles.layout} data-aside-last={asideLast}>
      <div className={styles.header}>{header}</div>
      <aside className={styles.aside} aria-label="Покупка">
        <div className={styles.sticky}>{aside}</div>
      </aside>
      <div className={styles.body}>{children}</div>
    </div>
  )
}
