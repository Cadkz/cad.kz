'use client'

import { type ReactNode, useEffect, useRef } from 'react'
import styles from './HeaderShell.module.css'

/** Сдвиг прокрутки, меньше которого направление не меняем: дрожание пальца не мигает шапкой. */
const STEP = 8

/**
 * Закреплённая первая строка шапки. Пока страница вверху — сливается с фоном; как только
 * её прокрутили, становится полупрозрачной с размытием и тонкой линией снизу.
 * На телефоне и планшете (до 960 px) шапка уезжает вверх при прокрутке вниз и возвращается
 * при прокрутке вверх — больше места под страницу (аудит 21.10.2026, М11); прячет её CSS по
 * атрибуту data-hidden. Не прячется, пока фокус в шапке (поиск) и в самом верху страницы.
 * Признаки пишутся прямо в атрибуты, без перерисовки React; слушатель прокрутки пассивный.
 */
export function HeaderShell({ children }: { children: ReactNode }) {
  const header = useRef<HTMLElement>(null)
  useEffect(() => {
    const element = header.current
    if (!element) return
    let frame = 0
    let last = window.scrollY
    const update = () => {
      frame = 0
      const y = window.scrollY
      element.dataset.scrolled = String(y > 0)
      if (Math.abs(y - last) < STEP) return
      const down = y > last && y > element.offsetHeight
      element.dataset.hidden = String(down && !element.contains(document.activeElement))
      last = y
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
    <header ref={header} className={styles.header} data-scrolled="false" data-hidden="false">
      {children}
    </header>
  )
}
