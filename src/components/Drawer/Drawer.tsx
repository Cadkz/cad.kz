'use client'

import { X } from 'lucide-react'
import { type ReactNode, useEffect, useId, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import styles from './Drawer.module.css'

type Props = {
  open: boolean
  onClose: () => void
  title: string
  children: ReactNode
  side?: 'left' | 'right'
}

const focusable =
  'a[href], button:not([disabled]), input:not([disabled]), select, textarea, summary, [tabindex]:not([tabindex="-1"])'

/** Держит фокус клавиатуры внутри панели: Tab с последнего элемента ведёт на первый и обратно. */
function trapFocus(event: KeyboardEvent, container: HTMLElement) {
  const items = [...container.querySelectorAll<HTMLElement>(focusable)].filter(
    (item) => item.offsetParent !== null,
  )
  const first = items[0]
  const last = items[items.length - 1]
  if (!first || !last) return
  const edge = event.shiftKey ? first : last
  if (document.activeElement !== edge) return
  event.preventDefault()
  ;(event.shiftKey ? last : first).focus()
}

/**
 * Выдвижная панель: мобильное меню, фильтр каталога, корзина.
 * Ловушка фокуса, закрытие по Escape и по клику на затемнение, возврат фокуса на кнопку.
 */
export function Drawer({ open, onClose, title, children, side = 'right' }: Props) {
  const panel = useRef<HTMLDivElement>(null)
  const titleId = useId()
  // Панель выносится в body: у липкой шапки есть backdrop-filter, внутри неё fixed не работает.
  const [mounted, setMounted] = useState(false)
  useEffect(() => setMounted(true), [])

  useEffect(() => {
    if (!open) return
    const opener = document.activeElement instanceof HTMLElement ? document.activeElement : null
    const root = document.documentElement
    root.dataset.scrollLocked = 'true'
    panel.current?.querySelector<HTMLElement>(focusable)?.focus()

    function onKey(event: KeyboardEvent) {
      if (event.key === 'Escape') onClose()
      else if (event.key === 'Tab' && panel.current) trapFocus(event, panel.current)
    }
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('keydown', onKey)
      delete root.dataset.scrollLocked
      opener?.focus()
    }
  }, [open, onClose])

  if (!mounted) return null
  return createPortal(
    <div className={styles.root} data-open={open} data-side={side} hidden={!open}>
      <button
        type="button"
        className={styles.backdrop}
        aria-label="Закрыть"
        tabIndex={-1}
        onClick={onClose}
      />
      <div
        ref={panel}
        className={styles.panel}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
      >
        <div className={styles.head}>
          <h2 id={titleId} className={styles.title}>
            {title}
          </h2>
          <button type="button" className={styles.close} onClick={onClose} aria-label="Закрыть">
            <X size={20} strokeWidth={1.75} aria-hidden="true" />
          </button>
        </div>
        <div className={styles.body}>{children}</div>
      </div>
    </div>,
    document.body,
  )
}
