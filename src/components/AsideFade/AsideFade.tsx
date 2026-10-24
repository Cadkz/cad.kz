'use client'

import { type ReactNode, useEffect, useRef } from 'react'
import styles from './AsideFade.module.css'

/** На сколько пикселей прокрутки карточка уходит в размытие и выныривает обратно. */
const RANGE = 160

const clamp = (value: number) => Math.min(1, Math.max(0, value))

/**
 * Липкая карточка покупки, которая уходит под широкий блок страницы (примеры сканов):
 * пока блок подъезжает, карточка размывается, гаснет и чуть уплывает вверх, под блоком её нет,
 * а когда он прошёл — выныривает снизу из размытия на прежнее место (просьба владельца
 * 24.10.2026: карточка одна, без дубля). Широкий блок ищется по `data-aside-cover` в той же
 * странице товара; его нет или экран уже 960 px — карточка просто стоит. Считаем по кадрам
 * прокрутки, меряем липкую обёртку, а двигаем внутреннюю — без обратной связи.
 */
export function AsideFade({ children }: { children: ReactNode }) {
  const outer = useRef<HTMLDivElement>(null)
  const inner = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const box = outer.current
    const card = inner.current
    const layout = box?.closest<HTMLElement>('[data-product-layout]')
    const cover = layout?.querySelector('[data-aside-cover]')
    if (!box || !card || !layout || !cover) return
    // Под широким блоком должно хватить места, чтобы карточка вынырнула целиком:
    // её высота плюс путь выныривания — запас для короткой комплектации (ProductLayout, .tail).
    const room = new ResizeObserver(() =>
      layout.style.setProperty('--aside-room', `${Math.ceil(card.offsetHeight + RANGE)}px`),
    )
    room.observe(card)
    const wide = window.matchMedia('(min-width: 960px)')
    let frame = 0

    const update = () => {
      frame = 0
      if (!wide.matches) {
        card.style.removeProperty('--fade')
        card.style.removeProperty('--fade-dir')
        card.removeAttribute('data-hidden')
        return
      }
      const own = box.getBoundingClientRect()
      const block = cover.getBoundingClientRect()
      // Подъезд блока снизу: 0 — далеко, 1 — край блока дошёл до низа карточки.
      const coming = clamp((own.bottom + RANGE - block.top) / RANGE)
      // Уход блока вверх: 1 — блок ещё закрывает карточку, 0 — ушёл выше на RANGE.
      const leaving = clamp((block.bottom - own.top + RANGE) / RANGE)
      const fade = Math.min(coming, leaving)
      card.style.setProperty('--fade', fade.toFixed(3))
      // До блока карточка уплывает вверх, после — выныривает снизу.
      card.style.setProperty('--fade-dir', coming <= leaving ? '-1' : '1')
      card.toggleAttribute('data-hidden', fade > 0.5)
    }
    const schedule = () => {
      if (!frame) frame = requestAnimationFrame(update)
    }
    update()
    window.addEventListener('scroll', schedule, { passive: true })
    window.addEventListener('resize', schedule)
    wide.addEventListener('change', schedule)
    return () => {
      room.disconnect()
      cancelAnimationFrame(frame)
      window.removeEventListener('scroll', schedule)
      window.removeEventListener('resize', schedule)
      wide.removeEventListener('change', schedule)
    }
  }, [])

  return (
    <div ref={outer} className={styles.sticky}>
      <div ref={inner} className={styles.card}>
        {children}
      </div>
    </div>
  )
}
