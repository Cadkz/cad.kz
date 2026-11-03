import type { ReactNode } from 'react'
import { StickyAside } from '../StickyAside/StickyAside'
import styles from './ProductLayout.module.css'

type Props = {
  header: ReactNode
  aside: ReactNode
  /** Под карточкой покупки, не липкий (условия покупки): от 960 px — внизу колонки. */
  asideFooter?: ReactNode
  children: ReactNode
  /** Широкий блок во всю рамку в самом низу (примеры сканов). */
  wide?: ReactNode
  /** На телефоне блок покупки после содержимого: сначала подбор по шагам, потом итог. */
  asideLast?: boolean
}

/**
 * Шаблон «Товар»: от 960 px — заголовок и содержимое на 8 колонок, блок покупки на 4, липкий
 * рядом с ними; условия покупки (asideFooter) — сразу под карточкой, не липкие: при прокрутке
 * уходят под закреплённую карточку (замечание владельца 03.11.2026: колонка целиком застревала, верх уходил под шапку). Широкий блок — под ними во всю рамку: карточка покупки до него не доходит.
 * На телефоне блок покупки идёт сразу после заголовка (или после содержимого — `asideLast`),
 * широкий блок — последним.
 */
export function ProductLayout({
  header,
  aside,
  asideFooter,
  children,
  wide,
  asideLast = false,
}: Props) {
  return (
    <div className={styles.layout} data-aside-last={asideLast}>
      <div className={styles.header}>{header}</div>
      <aside className={styles.aside} aria-label="Покупка">
        <StickyAside>{aside}</StickyAside>
        {asideFooter}
      </aside>
      <div className={styles.body}>{children}</div>
      {wide && <div className={styles.wide}>{wide}</div>}
    </div>
  )
}
