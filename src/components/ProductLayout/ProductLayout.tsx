import type { ReactNode } from 'react'
import { StickyAside } from '../StickyAside/StickyAside'
import styles from './ProductLayout.module.css'

type Props = {
  header: ReactNode
  aside: ReactNode
  /** Условия покупки: на высоком экране — под карточкой в липкой колонке, на низком — в тексте после `top`. */
  asideFooter?: ReactNode
  /** Начало содержимого (подбор комплекта): после него на низком экране идут условия покупки. */
  top?: ReactNode
  children: ReactNode
  /** Широкий блок во всю рамку в самом низу (примеры сканов). */
  wide?: ReactNode
  /** На телефоне блок покупки после содержимого: сначала подбор по шагам, потом итог. */
  asideLast?: boolean
}

/**
 * Шаблон «Товар»: от 960 px — заголовок и содержимое на 8 колонок, блок покупки на 4, липкий
 * рядом с ними; условия покупки (asideFooter) — сразу под карточкой и едут вниз вместе с ней (замечание владельца 03.11.2026: колонка целиком застревала, верх уходил под шапку).
 * На низком экране (ниже 960 px по высоте, замечание владельца 03.11.2026, 18:05: на экранах меньше
 * Full HD низ условий не был виден до конца страницы) липкая только карточка, условия — в тексте
 * сразу после подбора комплекта (`top`). Широкий блок — под ними во всю рамку.
 * На телефоне блок покупки идёт сразу после заголовка (или после содержимого — `asideLast`),
 * широкий блок — последним.
 */
export function ProductLayout({
  header,
  aside,
  asideFooter,
  top,
  children,
  wide,
  asideLast = false,
}: Props) {
  return (
    <div className={styles.layout} data-aside-last={asideLast}>
      <div className={styles.header}>{header}</div>
      <aside className={styles.aside} aria-label="Покупка">
        <StickyAside>
          {aside}
          {asideFooter && <div className={styles.footerAside}>{asideFooter}</div>}
        </StickyAside>
      </aside>
      <div className={styles.body}>
        {top}
        {asideFooter && <div className={styles.footerBody}>{asideFooter}</div>}
        {children}
      </div>
      {wide && <div className={styles.wide}>{wide}</div>}
    </div>
  )
}
