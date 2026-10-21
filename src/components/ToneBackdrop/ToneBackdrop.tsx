'use client'

import { useEffect, useRef } from 'react'
import type { LightTone } from '../ToneBand/ToneBand'
import styles from './ToneBackdrop.module.css'

const LIGHT: readonly string[] = ['base', 'mist', 'lilac', 'sky'] satisfies LightTone[]

/** Блок считается текущим, когда пересекает горизонтальную линию посередине экрана. */
const CENTER_LINE = '-50% 0px -50% 0px'

type Props = {
  /** Оттенок до первой прокрутки — тон первого светлого блока страницы. */
  initial: LightTone
}

/**
 * Общая подложка страницы под светлыми блоками (ToneBand). Один наблюдатель без прокрутки
 * в JS: когда светлый блок проходит середину экрана, подложка плавно (CSS, --duration-tone)
 * принимает его оттенок. Тёмные блоки рисуют свой фон и подложку не меняют — так светлый
 * текст соседних блоков никогда не оказывается на тёмном. При prefers-reduced-motion смена
 * мгновенная (в CSS). Без JS подложка остаётся в начальном оттенке.
 */
export function ToneBackdrop({ initial }: Props) {
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const backdrop = ref.current
    if (!backdrop || !('IntersectionObserver' in window)) return
    const io = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting || !(entry.target instanceof HTMLElement)) continue
          const tone = entry.target.dataset.tone
          if (tone && LIGHT.includes(tone)) backdrop.dataset.active = tone
        }
      },
      { rootMargin: CENTER_LINE },
    )
    for (const band of document.querySelectorAll('[data-tone]')) io.observe(band)
    return () => io.disconnect()
  }, [])

  return <div ref={ref} className={styles.backdrop} data-active={initial} aria-hidden="true" />
}
