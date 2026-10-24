import type { ReactNode } from 'react'
import styles from './ProductLayout.module.css'

type Props = {
  /** Заголовок страницы; без него — продолжение страницы ниже широкого блока (сканов). */
  header?: ReactNode
  aside: ReactNode
  children: ReactNode
  /** На телефоне блок покупки после содержимого: сначала подбор по шагам, потом итог. */
  asideLast?: boolean
  /** Блок покупки только от 960 px: на телефоне он есть ниже, во второй части страницы. */
  asideDesktopOnly?: boolean
}

/**
 * Шаблон «Товар»: от 960 px — заголовок и содержимое на 8 колонок, блок покупки на 4, липкий.
 * На телефоне блок покупки идёт сразу после заголовка (или после содержимого — `asideLast`).
 */
export function ProductLayout({
  header,
  aside,
  children,
  asideLast = false,
  asideDesktopOnly = false,
}: Props) {
  return (
    <div
      className={styles.layout}
      data-aside-last={asideLast}
      data-headless={!header}
      data-aside-desktop={asideDesktopOnly}
    >
      {header && <div className={styles.header}>{header}</div>}
      <aside className={styles.aside} aria-label="Покупка">
        <div className={styles.sticky}>{aside}</div>
      </aside>
      <div className={styles.body}>{children}</div>
    </div>
  )
}
