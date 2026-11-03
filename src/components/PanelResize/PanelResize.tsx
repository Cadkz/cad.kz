'use client'

import { type PointerEvent as ReactPointerEvent, type RefObject, useEffect, useState } from 'react'
import styles from './PanelResize.module.css'

type Edge = 'top' | 'left' | 'corner'

type Props = {
  /** Окно, у которого меняется размер: окно стоит в правом нижнем углу, растёт вверх и влево. */
  target: RefObject<HTMLElement | null>
}

/** Пределы окна Кадди: не уже и не ниже удобного, не шире 720 px и не выше экрана под шапкой. */
const MIN_WIDTH = 360
const MAX_WIDTH = 720
const MIN_HEIGHT = 480
/** Отступы от краёв экрана: справа и снизу окно стоит на 24 px, сверху — шапка 72 и 8 px. */
const EDGE = 24
const TOP = 80
const STORAGE_KEY = 'cadkz-kaddi-size'
/** Размер уже меняли — подсказка уголком больше не мигает. */
const SEEN_KEY = 'cadkz-kaddi-resized'

const clamp = (value: number, min: number, max: number) => Math.min(Math.max(value, min), max)

function apply(element: HTMLElement, width: number, height: number) {
  const w = Math.round(clamp(width, MIN_WIDTH, Math.min(MAX_WIDTH, window.innerWidth - EDGE * 2)))
  const h = Math.round(clamp(height, MIN_HEIGHT, window.innerHeight - TOP - EDGE))
  element.style.setProperty('--panel-width', `${w}px`)
  element.style.setProperty('--panel-height', `${h}px`)
  return { w, h }
}

/**
 * Окно Кадди можно растянуть мышью, как окно Windows (просьба владельца 03.11.2026): за верхний
 * край — выше, за левый — шире, за левый верхний угол — и то и другое. Только от 640 px и с
 * мышью; размер запоминается в этом браузере. Двойной щелчок по краю — прежний размер.
 */
export function PanelResize({ target }: Props) {
  const [hint, setHint] = useState(false)
  useEffect(() => {
    try {
      setHint(!localStorage.getItem(SEEN_KEY))
    } catch {
      // Хранилище недоступно — подсказку не показываем.
    }
  }, [])
  useEffect(() => {
    const element = target.current
    if (!element) return
    try {
      const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? 'null')
      if (saved && typeof saved.w === 'number' && typeof saved.h === 'number')
        apply(element, saved.w, saved.h)
    } catch {
      // Хранилище недоступно — окно обычного размера.
    }
  }, [target])

  const start = (edge: Edge) => (event: ReactPointerEvent<HTMLDivElement>) => {
    const element = target.current
    if (!element || event.button !== 0) return
    event.preventDefault()
    const rect = element.getBoundingClientRect()
    const x = event.clientX
    const y = event.clientY
    let size = { w: rect.width, h: rect.height }
    element.dataset.resizing = 'true'
    const move = (moveEvent: PointerEvent) => {
      size = apply(
        element,
        edge === 'top' ? rect.width : rect.width + (x - moveEvent.clientX),
        edge === 'left' ? rect.height : rect.height + (y - moveEvent.clientY),
      )
    }
    const end = () => {
      delete element.dataset.resizing
      window.removeEventListener('pointermove', move)
      window.removeEventListener('pointerup', end)
      setHint(false)
      try {
        localStorage.setItem(SEEN_KEY, '1')
        localStorage.setItem(STORAGE_KEY, JSON.stringify(size))
      } catch {
        // Не запомнили — не страшно.
      }
    }
    window.addEventListener('pointermove', move)
    window.addEventListener('pointerup', end)
  }

  const reset = () => {
    const element = target.current
    if (!element) return
    element.style.removeProperty('--panel-width')
    element.style.removeProperty('--panel-height')
    try {
      localStorage.removeItem(STORAGE_KEY)
    } catch {
      // Ничего страшного.
    }
  }

  return (
    <>
      <div
        className={styles.top}
        onPointerDown={start('top')}
        onDoubleClick={reset}
        aria-hidden="true"
      />
      <div
        className={styles.left}
        onPointerDown={start('left')}
        onDoubleClick={reset}
        aria-hidden="true"
      />
      <div
        className={styles.corner}
        data-hint={hint || undefined}
        title="Потяните, чтобы изменить размер окна"
        onPointerDown={start('corner')}
        onDoubleClick={reset}
        aria-hidden="true"
      />
    </>
  )
}
