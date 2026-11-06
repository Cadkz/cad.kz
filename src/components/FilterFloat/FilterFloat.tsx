'use client'

import { SlidersHorizontal } from 'lucide-react'
import { type RefObject, useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { useT } from '../LangProvider/LangProvider'
import styles from './FilterFloat.module.css'

/**
 * Плавающая кнопка «Фильтры» (вариант C, 07.11.2026): когда кнопки над каталогом уже не видно,
 * а карточки ещё на экране, внизу по центру всплывает стеклянная капсула со счётчиком условий.
 * Нажатие — вернуться к началу каталога и открыть фильтр (на телефоне — выдвижную панель).
 * Ушёл из каталога — капсула гаснет.
 */
export function FilterFloat({
  target,
  count,
  onOpen,
}: {
  target: RefObject<HTMLElement | null>
  count: number
  onOpen: () => void
}) {
  const t = useT()
  const [shown, setShown] = useState(false)
  // Капсула — в конце body: блоки витрины с анимацией (transform) запирали бы fixed и z-index внутри себя.
  const [mounted, setMounted] = useState(false)
  useEffect(() => setMounted(true), [])

  useEffect(() => {
    let frame = 0
    const check = () => {
      frame = 0
      const box = target.current?.getBoundingClientRect()
      // Верх каталога ушёл под шапку, а низ ещё в нижних двух третях экрана.
      setShown(Boolean(box && box.top < 0 && box.bottom > window.innerHeight / 3))
    }
    const onScroll = () => {
      if (!frame) frame = requestAnimationFrame(check)
    }
    check()
    window.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('resize', onScroll)
    return () => {
      cancelAnimationFrame(frame)
      window.removeEventListener('scroll', onScroll)
      window.removeEventListener('resize', onScroll)
    }
  }, [target])

  const open = () => {
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    target.current?.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'start' })
    onOpen()
  }

  if (!mounted) return null
  return createPortal(
    <button type="button" className={styles.float} data-shown={shown} inert={!shown} onClick={open}>
      <SlidersHorizontal size={16} strokeWidth={1.75} aria-hidden="true" />
      {t('Фильтры')}
      {count > 0 && (
        <span className={styles.count} key={count}>
          {count}
        </span>
      )}
    </button>,
    document.body,
  )
}
