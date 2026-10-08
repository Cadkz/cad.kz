import type { ReactNode } from 'react'
import styles from './ProductSection.module.css'

type Props = {
  title: string
  id?: string
  sub?: string
  /** Отдельный блок после основной сетки: добавляется вертикальный отступ секции. */
  standalone?: boolean
  children: ReactNode
}

/** Раздел внутри страницы товара или статьи: заголовок h2 и содержимое, без своей рамки. */
export function ProductSection({ title, id, sub, standalone = false, children }: Props) {
  return (
    <section
      id={id}
      className={standalone ? `${styles.section} ${styles.standalone}` : styles.section}
      aria-labelledby={id ? `${id}-title` : undefined}
    >
      <h2 id={id ? `${id}-title` : undefined}>{title}</h2>
      {sub && <p className={styles.sub}>{sub}</p>}
      <div className={styles.body}>{children}</div>
    </section>
  )
}
