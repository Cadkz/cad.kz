'use client'

import { useEffect, useRef } from 'react'
import { drawIsolines, type IsolineStyle, wanderPoint } from '@/lib/isolines'
import styles from './Isolines.module.css'

/** Скорость изменения рельефа и течения вбок (в секунду). */
const TIME_SPEED = 0.022
const DRIFT_SPEED = 3.5
/** Насколько быстро точка света догоняет курсор (доля пути за кадр при 60 к/с). */
const FOLLOW = 0.025
/** Курсор ушёл из блока — через столько секунд свет снова блуждает сам. */
const POINTER_IDLE = 2.5
/** Появление линий при загрузке, секунд. */
const REVEAL_SECONDS = 1.8
/** Кадр дороже этого (мс) — устройство слабое: оставляем неподвижную картинку. */
const SLOW_FRAME_MS = 14

type NavigatorHints = Navigator & {
  deviceMemory?: number
  connection?: { saveData?: boolean }
}

/** Экономия трафика, очень мало памяти или два ядра — сразу неподвижная картинка, без проб. */
function isWeakByHints() {
  const nav: NavigatorHints = navigator
  return (
    nav.connection?.saveData === true ||
    (nav.deviceMemory ?? 8) <= 2 ||
    (nav.hardwareConcurrency || 8) <= 2
  )
}

/**
 * Живая карта горизонталей в первом экране главной: рельеф медленно течёт, под курсором
 * поднимается холм — вокруг него кольца линий и свет, как от фонарика над картой. На телефоне
 * точка света сама медленно блуждает. Линии проявляются кругом после загрузки страницы (в
 * свободное время браузера, первому показу не мешают). За краем экрана и на скрытой вкладке
 * не считаются. При «уменьшить движение», экономии трафика или если кадр дольше 14 мс —
 * один неподвижный кадр.
 */
export function Isolines() {
  const ref = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = ref.current
    const ctx = canvas?.getContext('2d')
    const host = canvas?.parentElement
    if (!canvas || !ctx || !host) return

    const css = getComputedStyle(canvas)
    const style: IsolineStyle = {
      line: css.getPropertyValue('--isoline-line').trim(),
      index: css.getPropertyValue('--isoline-index').trim(),
      dpr: Math.min(window.devicePixelRatio || 1, 1.5),
    }
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)')
    let still = reduced.matches || isWeakByHints()
    const s = {
      width: 0,
      height: 0,
      seconds: 0,
      reveal: still ? 1 : 0,
      focusX: 0,
      focusY: 0,
      pointerX: 0,
      pointerY: 0,
      pointerAt: Number.NEGATIVE_INFINITY,
    }
    let raf = 0
    let last = 0
    let inView = true
    let slowFrames = 0

    const render = () => {
      if (!s.width || !s.height) return 0
      const start = performance.now()
      drawIsolines(
        ctx,
        {
          width: s.width,
          height: s.height,
          time: 3.2 + s.seconds * TIME_SPEED,
          drift: s.seconds * DRIFT_SPEED,
          focusX: s.focusX,
          focusY: s.focusY,
          reveal: s.reveal,
        },
        style,
      )
      return performance.now() - start
    }

    const step = (dt: number) => {
      s.seconds += dt
      s.reveal = Math.min(1, s.reveal + dt / REVEAL_SECONDS)
      const pointerLive = s.seconds - s.pointerAt < POINTER_IDLE
      const [tx, ty] = pointerLive
        ? [s.pointerX, s.pointerY]
        : wanderPoint(s.width, s.height, s.seconds)
      const k = 1 - (1 - FOLLOW) ** (dt * 60)
      s.focusX += (tx - s.focusX) * k
      s.focusY += (ty - s.focusY) * k
    }

    const stop = () => {
      cancelAnimationFrame(raf)
      raf = 0
    }

    const tick = (now: number) => {
      raf = requestAnimationFrame(tick)
      const dt = Math.min(now - last, 100) / 1000
      last = now
      step(dt)
      // Несколько тяжёлых кадров подряд — останавливаемся на текущей картинке.
      slowFrames = render() > SLOW_FRAME_MS ? slowFrames + 1 : 0
      if (slowFrames >= 5) {
        still = true
        s.reveal = 1
        stop()
        render()
      }
    }

    const play = () => {
      if (still || raf || !inView) return
      last = performance.now()
      raf = requestAnimationFrame(tick)
    }

    const resize = () => {
      const box = canvas.getBoundingClientRect()
      s.width = Math.round(box.width)
      s.height = Math.round(box.height)
      canvas.width = Math.round(s.width * style.dpr)
      canvas.height = Math.round(s.height * style.dpr)
      if (!s.focusX) [s.focusX, s.focusY] = wanderPoint(s.width, s.height, 0)
      render()
    }

    const onPointer = (event: PointerEvent) => {
      if (event.pointerType !== 'mouse') return
      const box = canvas.getBoundingClientRect()
      s.pointerX = event.clientX - box.left
      s.pointerY = event.clientY - box.top
      s.pointerAt = s.seconds
    }

    const onReducedChange = () => {
      still = reduced.matches
      s.reveal = 1
      if (still) {
        stop()
        render()
      } else play()
    }

    const sizeObserver = new ResizeObserver(resize)
    const viewObserver = new IntersectionObserver(([entry]) => {
      inView = entry?.isIntersecting ?? false
      if (inView) play()
      else stop()
    })

    const start = () => {
      resize()
      // Пробный кадр: очень долго — устройство слабое, оставляем неподвижную картинку.
      if (!still && render() > SLOW_FRAME_MS * 2) {
        still = true
        s.reveal = 1
        render()
      }
      canvas.dataset.ready = 'yes'
      sizeObserver.observe(canvas)
      viewObserver.observe(canvas)
      host.addEventListener('pointermove', onPointer, { passive: true })
      reduced.addEventListener('change', onReducedChange)
      play()
    }

    // Не мешаем первому показу страницы: рисуем, когда браузер освободился.
    // Safari до 2025 года не знает requestIdleCallback — там короткая пауза.
    let cancelStart: () => void
    if (typeof window.requestIdleCallback === 'function') {
      const id = window.requestIdleCallback(start, { timeout: 1200 })
      cancelStart = () => window.cancelIdleCallback(id)
    } else {
      const id = window.setTimeout(start, 300)
      cancelStart = () => window.clearTimeout(id)
    }

    return () => {
      cancelStart()
      stop()
      sizeObserver.disconnect()
      viewObserver.disconnect()
      host.removeEventListener('pointermove', onPointer)
      reduced.removeEventListener('change', onReducedChange)
    }
  }, [])

  // Пустой холст без содержимого экранные чтецы не озвучивают.
  return <canvas ref={ref} className={styles.canvas} />
}
