'use client'

import { useEffect } from 'react'

const SELECTOR = '[data-reveal]'

/** Блок считается вошедшим в экран, когда его верх поднялся выше 92 % высоты экрана. */
const ROOT_MARGIN = '0px 0px -8% 0px'

/**
 * Запускает появление при прокрутке для всех элементов с data-reveal (Reveal, штрих над
 * заголовком Section, свечение Aurora onScroll, чертёж BannerArt onScroll). Элемент ниже
 * экрана получает data-reveal="wait" (скрыт в CSS), а как только входит в экран — "in",
 * и CSS доигрывает анимацию по времени. Уже видимое при загрузке остаётся как есть.
 * Один наблюдатель на страницу; новые блоки после перехода по ссылке подхватываются сами.
 * При prefers-reduced-motion ничего не делает — всё видно сразу.
 */
export function RevealObserver() {
  useEffect(() => {
    if (!('IntersectionObserver' in window)) return
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return

    const io = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue
          const el = entry.target
          if (el instanceof HTMLElement) el.dataset.reveal = 'in'
          io.unobserve(el)
        }
      },
      { rootMargin: ROOT_MARGIN },
    )

    const register = (el: Element) => {
      if (!(el instanceof HTMLElement)) return
      const state = el.dataset.reveal
      if (state === 'in' || state === 'done') return
      // Уже ждёт (наблюдатель перезапустился) — снова следим, состояние не трогаем.
      if (state === 'wait') {
        io.observe(el)
        return
      }
      // Уже в экране (или выше) — показываем без анимации, чтобы ничего не мигало.
      if (el.getBoundingClientRect().top < window.innerHeight * 0.92) {
        el.dataset.reveal = 'done'
        return
      }
      el.dataset.reveal = 'wait'
      io.observe(el)
    }

    const scan = (root: ParentNode) => {
      if (root instanceof Element && root.matches(SELECTOR)) register(root)
      for (const el of root.querySelectorAll(SELECTOR)) register(el)
    }

    scan(document)

    // Переходы по сайту без перезагрузки: новые блоки появляются в DOM — регистрируем их
    // до отрисовки (колбэк MutationObserver выполняется раньше кадра).
    const mo = new MutationObserver((records) => {
      for (const record of records) {
        for (const node of record.addedNodes) {
          if (node instanceof Element) scan(node)
        }
      }
    })
    mo.observe(document.body, { childList: true, subtree: true })

    return () => {
      mo.disconnect()
      io.disconnect()
    }
  }, [])

  return null
}
