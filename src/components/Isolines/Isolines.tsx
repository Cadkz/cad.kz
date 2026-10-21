'use client'

import { useEffect, useRef } from 'react'
import { drawIsolines, type IsolineStyle } from '@/lib/isolines'
import styles from './Isolines.module.css'

/** Кадров в секунду: движение медленное, 24 хватает с запасом и бережёт батарею. */
const FPS = 24
/** Скорость изменения рельефа и течения вбок (в секунду). */
const TIME_SPEED = 0.035
const DRIFT_SPEED = 7
/** Кадр дороже этого (мс) — устройство слабое: оставляем неподвижную картинку. */
const SLOW_FRAME_MS = 14
/** Момент «рельефа» для неподвижной картинки — подобран, чтобы линии легли красиво. */
const STILL_TIME = 3.2

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
 * Медленно текущие изолинии в фирменном синем — только в первом экране главной.
 * Рисуются после загрузки страницы (в свободное время браузера), не мешая первому показу.
 * За краем экрана и на скрытой вкладке не считаются. При «уменьшить движение», экономии
 * трафика или если кадр на устройстве считается дольше 14 мс — один неподвижный кадр.
 */
export function Isolines() {
  const ref = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = ref.current
    const ctx = canvas?.getContext('2d')
    if (!canvas || !ctx) return

    const css = getComputedStyle(canvas)
    const style: IsolineStyle = {
      line: css.getPropertyValue('--isoline-line').trim(),
      index: css.getPropertyValue('--isoline-index').trim(),
      dpr: Math.min(window.devicePixelRatio || 1, 1.5),
    }
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)')
    let still = reduced.matches || isWeakByHints()
    let width = 0
    let height = 0
    let time = STILL_TIME
    let raf = 0
    let last = 0
    let inView = true
    let slowFrames = 0

    const render = () => {
      if (!width || !height) return 0
      const start = performance.now()
      drawIsolines(
        ctx,
        width,
        height,
        time,
        (time - STILL_TIME) * (DRIFT_SPEED / TIME_SPEED),
        style,
      )
      return performance.now() - start
    }

    const stop = () => {
      cancelAnimationFrame(raf)
      raf = 0
    }

    const tick = (now: number) => {
      raf = requestAnimationFrame(tick)
      if (now - last < 1000 / FPS) return
      const dt = Math.min(now - last, 100) / 1000
      last = now
      time += dt * TIME_SPEED
      // Несколько тяжёлых кадров подряд — останавливаемся на текущей картинке.
      slowFrames = render() > SLOW_FRAME_MS ? slowFrames + 1 : 0
      if (slowFrames >= 3) {
        still = true
        stop()
      }
    }

    const play = () => {
      if (still || raf || !inView) return
      last = performance.now()
      raf = requestAnimationFrame(tick)
    }

    const resize = () => {
      const box = canvas.getBoundingClientRect()
      width = Math.round(box.width)
      height = Math.round(box.height)
      canvas.width = Math.round(width * style.dpr)
      canvas.height = Math.round(height * style.dpr)
      render()
    }

    const onReducedChange = () => {
      still = reduced.matches
      if (still) stop()
      else play()
    }

    const sizeObserver = new ResizeObserver(resize)
    const viewObserver = new IntersectionObserver(([entry]) => {
      inView = entry?.isIntersecting ?? false
      if (inView) play()
      else stop()
    })

    const start = () => {
      resize()
      // Пробный кадр: долго — устройство слабое, оставляем неподвижную картинку.
      if (render() > SLOW_FRAME_MS) still = true
      canvas.dataset.ready = 'yes'
      sizeObserver.observe(canvas)
      viewObserver.observe(canvas)
      reduced.addEventListener('change', onReducedChange)
      play()
    }

    // Не мешаем первому показу страницы: рисуем, когда браузер освободился.
    // Safari до 2025 года не знает requestIdleCallback — там короткая пауза.
    let cancelStart: () => void
    if (typeof window.requestIdleCallback === 'function') {
      const id = window.requestIdleCallback(start, { timeout: 1500 })
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
      reduced.removeEventListener('change', onReducedChange)
    }
  }, [])

  // Пустой холст без содержимого экранные чтецы не озвучивают.
  return <canvas ref={ref} className={styles.canvas} />
}
