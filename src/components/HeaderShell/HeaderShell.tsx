'use client'

import { type ReactNode, useEffect, useRef } from 'react'
import styles from './HeaderShell.module.css'

/**
 * Закреплённая первая строка шапки. Пока страница вверху — сливается с фоном; как только
 * её прокрутили, становится полупрозрачной с размытием и тонкой линией снизу.
 * Признак пишется прямо в атрибут, без перерисовки React; слушатель прокрутки пассивный.
 */
export function HeaderShell({ children }: { children: ReactNode }) {
  const header = useRef<HTMLElement>(null)
  useEffect(() => {
    const element = header.current
    if (!element) return
    let frame = 0
    const update = () => {
      frame = 0
      element.dataset.scrolled = String(window.scrollY > 0)
    }
    const onScroll = () => {
      if (!frame) frame = requestAnimationFrame(update)
    }
    update()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => {
      window.removeEventListener('scroll', onScroll)
      cancelAnimationFrame(frame)
    }
  }, [])
  return (
    <header ref={header} className={styles.header} data-scrolled="false">
      {children}
    </header>
  )
}
