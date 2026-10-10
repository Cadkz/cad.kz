'use client'

import { type RefObject, useEffect } from 'react'

const TYPE_MS = 70
const HOLD_MS = 1800
const FADE_MS = 300
const PAUSE_MS = 400

/**
 * «Печатает» примеры запросов в подсказке пустого поля: по букве, пауза, плавно гаснет, следующий.
 * Пишет прямо в текст элемента, без перерисовки React: размер поля не меняется, ввод не трогается.
 * active = false (поле в фокусе, в нём есть текст, поле скрыто) — сразу стоп.
 * Пользователь просил меньше движения — один пример без анимации.
 * После rounds кругов печать останавливается на первом примере: постоянно меняющийся текст
 * не должен отвлекать от работы с сайтом.
 */
export function useTypingHint(
  target: RefObject<HTMLElement | null>,
  hints: readonly string[],
  active: boolean,
  rounds = 2,
) {
  useEffect(() => {
    const element = target.current
    const [first] = hints
    if (!element || !first) return
    if (!active) {
      element.textContent = ''
      delete element.dataset.fading
      return
    }
    const still = () => {
      element.textContent = `Например, ${first}`
    }
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return still()
    let timer: ReturnType<typeof setTimeout>
    let hint = 0
    let length = 0
    const later = (fn: () => void, ms: number) => {
      timer = setTimeout(fn, ms)
    }
    const step = () => {
      // Вкладка в фоне или поле скрыто на этой ширине экрана — ждём, не тратим батарею.
      if (document.hidden || element.offsetParent === null) return later(step, 1000)
      if (hint >= hints.length * rounds) return still()
      const text = hints[hint % hints.length] ?? first
      if (length < text.length) {
        length += 1
        element.textContent = text.slice(0, length)
        return later(step, TYPE_MS)
      }
      later(() => {
        element.dataset.fading = 'true'
        later(() => {
          element.textContent = ''
          delete element.dataset.fading
          hint += 1
          length = 0
          later(step, PAUSE_MS)
        }, FADE_MS)
      }, HOLD_MS)
    }
    later(step, PAUSE_MS)
    return () => {
      clearTimeout(timer)
      element.textContent = ''
      delete element.dataset.fading
    }
  }, [target, hints, active, rounds])
}
