'use client'

import { usePathname } from 'next/navigation'
import { type ReactNode, ViewTransition } from 'react'
import styles from './PageTransition.module.css'

/** Метка запускает переход только у ссылок с направлением; остальные переходы — без анимации. */
const DIRECTION = { 'nav-forward': 'nav-mark', 'nav-back': 'nav-mark', default: 'none' }

/**
 * Переход между страницами — свайп всего экрана (правка владельца 03.11.2026): вперёд новая
 * страница приходит справа, назад — слева. Двигается снимок экрана целиком (root), а не
 * содержимое страницы: снимок длинной страницы при прокрутке показывал её верх (баннер главной)
 * и открывал новую с середины. Шапка стоит на месте (своё имя перехода в HeaderShell).
 *
 * Сама анимация — в src/styles/base.css «Переходы» по типу перехода. React запускает переход,
 * только если есть что анимировать, поэтому в углу экрана — невидимая метка, которая меняется
 * с адресом страницы.
 */
export function PageTransition({ children }: { children: ReactNode }) {
  const pathname = usePathname()
  return (
    <>
      <ViewTransition key={pathname} enter={DIRECTION} exit={DIRECTION} default="none">
        <span className={styles.mark} aria-hidden="true" />
      </ViewTransition>
      {children}
    </>
  )
}
