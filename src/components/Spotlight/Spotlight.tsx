'use client'

import { type PointerEvent, type ReactNode, useRef } from 'react'
import styles from './Spotlight.module.css'

/** Только мышь или тачпад: на телефоне и планшете эффекта нет. */
const FINE = '(hover: hover) and (pointer: fine)'

/**
 * «Прожектор» (этап 4 анимаций, 02.11.2026): мягкое голубое пятно идёт за указателем по карточкам
 * блока. Карточки отмечаются data-spot, свечение рисует сама карточка (::after в её стилях) по
 * переменным --spot-x и --spot-y — их ставит этот компонент. Положение пишется в стиль элемента
 * из обработчика (в разметке inline-style нет), не чаще раза за кадр. Без JavaScript, на телефоне
 * и при «меньше движения» блок обычный.
 */
export function Spotlight({ children }: { children: ReactNode }) {
  const root = useRef<HTMLDivElement>(null)
  const frame = useRef(0)

  const onPointerMove = (event: PointerEvent) => {
    if (event.pointerType !== 'mouse' || !window.matchMedia(FINE).matches) return
    const { clientX, clientY } = event
    cancelAnimationFrame(frame.current)
    frame.current = requestAnimationFrame(() => {
      for (const card of root.current?.querySelectorAll<HTMLElement>('[data-spot]') ?? []) {
        const box = card.getBoundingClientRect()
        card.style.setProperty('--spot-x', `${Math.round(clientX - box.left)}px`)
        card.style.setProperty('--spot-y', `${Math.round(clientY - box.top)}px`)
      }
    })
  }

  return (
    <div ref={root} className={styles.root} onPointerMove={onPointerMove}>
      {children}
    </div>
  )
}
