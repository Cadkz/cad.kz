import type { ReactNode } from 'react'
import { AsideFade } from '../AsideFade/AsideFade'
import styles from './ProductLayout.module.css'

type Props = {
  header: ReactNode
  aside: ReactNode
  children: ReactNode
  /** Широкий блок во всю рамку (примеры сканов): проходит над колонкой покупки. */
  wide?: ReactNode
  /** Содержимое под широким блоком (комплектация, вопросы): итог снова рядом. */
  tail?: ReactNode
  /** На телефоне блок покупки после содержимого: сначала подбор по шагам, потом итог. */
  asideLast?: boolean
}

/**
 * Шаблон «Товар»: от 960 px — заголовок и содержимое на 8 колонок, блок покупки на 4, липкий
 * на всю высоту страницы. Широкий блок идёт во всю рамку поверх колонки покупки: карточка
 * уходит под него в размытие и выныривает под ним (AsideFade) — карточка одна.
 * На телефоне блок покупки идёт сразу после заголовка (или в конце — `asideLast`).
 */
export function ProductLayout({ header, aside, children, wide, tail, asideLast = false }: Props) {
  return (
    <div
      className={styles.layout}
      data-product-layout=""
      data-aside-last={asideLast}
      data-wide={Boolean(wide)}
    >
      <div className={styles.header}>{header}</div>
      <aside className={styles.aside} aria-label="Покупка">
        <AsideFade>{aside}</AsideFade>
      </aside>
      <div className={styles.body}>{children}</div>
      {wide && (
        <div className={styles.wide} data-aside-cover="">
          {wide}
        </div>
      )}
      {tail && <div className={`${styles.body} ${styles.tail}`}>{tail}</div>}
    </div>
  )
}
