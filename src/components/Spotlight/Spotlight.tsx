'use client'

import { type ReactNode, useEffect, useRef } from 'react'
import styles from './Spotlight.module.css'

const TILT = 6

/**
 * Свет за курсором для группы карточек: карточке с data-spot под мышью задаются --spot-x и
 * --spot-y (координаты курсора внутри неё) и наклон --tilt-x / --tilt-y, а CSS карточки рисует
 * там мягкое пятно света, подсвечивает рамку и чуть поворачивает карточку к курсору. Один обработчик на всю группу, только мышь; на телефоне ничего не делает.
 */
export function Spotlight({ children }: { children: ReactNode }) {
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const group = ref.current
    if (!group) return
    const onMove = (event: PointerEvent) => {
      if (event.pointerType !== 'mouse' || !(event.target instanceof Element)) return
      const card = event.target.closest<HTMLElement>('[data-spot]')
      if (!card) return
      const box = card.getBoundingClientRect()
      const x = event.clientX - box.left
      const y = event.clientY - box.top
      card.style.setProperty('--spot-x', `${Math.round(x)}px`)
      card.style.setProperty('--spot-y', `${Math.round(y)}px`)
      // Лёгкий наклон к курсору: не больше TILT градусов по каждой оси.
      card.style.setProperty('--tilt-x', `${((0.5 - y / box.height) * TILT).toFixed(2)}deg`)
      card.style.setProperty('--tilt-y', `${((x / box.width - 0.5) * TILT).toFixed(2)}deg`)
    }
    group.addEventListener('pointermove', onMove, { passive: true })
    return () => group.removeEventListener('pointermove', onMove)
  }, [])

  return (
    <div ref={ref} className={styles.group}>
      {children}
    </div>
  )
}
