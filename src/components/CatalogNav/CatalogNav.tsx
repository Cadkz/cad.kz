'use client'

import { ChevronDown, LayoutGrid } from 'lucide-react'
import { usePathname } from 'next/navigation'
import {
  type PointerEvent as ReactPointerEvent,
  useCallback,
  useEffect,
  useRef,
  useState,
} from 'react'
import type { MenuTab } from '@/lib/navigation'
import { MegaMenu } from '../MegaMenu/MegaMenu'
import styles from './CatalogNav.module.css'

type Props = { menu: MenuTab[]; whatsappHref: string | null }

/**
 * Кнопка «Каталог» в первой строке шапки (от 960 px) и мегаменю под ней.
 * Открывается наведением мыши или нажатием, закрывается уходом мыши (с задержкой), щелчком
 * мимо и Escape — фокус возвращается на кнопку. Само мегаменю (группа → раздел → производитель
 * → линейка → товары) не менялось.
 */
export function CatalogNav({ menu, whatsappHref }: Props) {
  const [open, setOpen] = useState(false)
  const root = useRef<HTMLDivElement>(null)
  const button = useRef<HTMLButtonElement>(null)
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined)
  // Меню только что открылось наведением — щелчок по той же кнопке не должен его закрыть.
  const hoveredAt = useRef(0)
  const pathname = usePathname()
  const close = useCallback(() => setOpen(false), [])

  // biome-ignore lint/correctness/useExhaustiveDependencies: перешли на другую страницу — меню закрыто
  useEffect(() => setOpen(false), [pathname])

  useEffect(() => {
    if (!open) return
    function onPointer(event: PointerEvent) {
      if (event.target instanceof Node && !root.current?.contains(event.target)) setOpen(false)
    }
    function onKey(event: KeyboardEvent) {
      if (event.key !== 'Escape') return
      button.current?.focus()
      setOpen(false)
    }
    document.addEventListener('pointerdown', onPointer)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('pointerdown', onPointer)
      document.removeEventListener('keydown', onKey)
    }
  }, [open])

  function hover(next: boolean) {
    return (event: ReactPointerEvent) => {
      if (event.pointerType !== 'mouse') return
      clearTimeout(timer.current)
      if (next) {
        if (!open) hoveredAt.current = Date.now()
        setOpen(true)
      } else timer.current = setTimeout(() => setOpen(false), 200)
    }
  }

  return (
    <div ref={root} className={styles.root}>
      <button
        ref={button}
        type="button"
        className={styles.trigger}
        aria-expanded={open}
        aria-controls="nav-catalog"
        onPointerEnter={hover(true)}
        onPointerLeave={hover(false)}
        onClick={() => {
          if (open && Date.now() - hoveredAt.current < 600) return
          setOpen(!open)
        }}
      >
        <LayoutGrid size={16} strokeWidth={1.75} aria-hidden="true" />
        Каталог
        <ChevronDown size={16} strokeWidth={1.75} className={styles.chevron} aria-hidden="true" />
      </button>
      {/* Мегаменю без обёртки: оно позиционировано по строке шапки и не встаёт в её ряд. */}
      {open && (
        <MegaMenu
          id="nav-catalog"
          tabs={menu}
          onNavigate={close}
          whatsappHref={whatsappHref}
          onPointerEnter={hover(true)}
          onPointerLeave={hover(false)}
        />
      )}
    </div>
  )
}
