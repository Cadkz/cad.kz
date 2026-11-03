'use client'

import { type ReactNode, useEffect, useRef } from 'react'
import styles from './StickyAside.module.css'

type Props = { children: ReactNode; className?: string }

/**
 * Липкая колонка без своей полосы прокрутки (замечание владельца 03.11.2026). Влезает в экран —
 * стоит под шапкой. Выше экрана (покупка с условиями на ноутбуке) — листается со страницей, пока
 * не покажется её низ, и дальше стоит низом у края экрана. Высоту колонки CSS берёт из
 * --aside-height, её обновляет ResizeObserver.
 */
export function StickyAside({ children, className }: Props) {
  const ref = useRef<HTMLDivElement>(null)
  useEffect(() => {
    const node = ref.current
    if (!node) return
    const update = () => node.style.setProperty('--aside-height', `${node.offsetHeight}px`)
    update()
    const observer = new ResizeObserver(update)
    observer.observe(node)
    return () => observer.disconnect()
  }, [])
  return (
    <div ref={ref} className={`${styles.sticky} ${className ?? ''}`}>
      {children}
    </div>
  )
}
