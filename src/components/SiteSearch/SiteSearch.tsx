'use client'

import { Search } from 'lucide-react'
import { usePathname } from 'next/navigation'
import { useCallback, useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { SearchBox } from '../SearchBox/SearchBox'
import styles from './SiteSearch.module.css'

type Props = { hints: readonly string[]; whatsappHref: string | null }

/**
 * Поиск в шапке. От 1200 px — поле прямо в шапке. Уже — значок: открывает панель с полем
 * под шапкой (планшет) или на весь экран (телефон). Панель выносится в body: у липкой шапки
 * backdrop-filter, внутри неё position: fixed не работает.
 */
export function SiteSearch({ hints, whatsappHref }: Props) {
  const [open, setOpen] = useState(false)
  const [mounted, setMounted] = useState(false)
  const toggle = useRef<HTMLButtonElement>(null)
  const layer = useRef<HTMLDivElement>(null)
  const pathname = usePathname()
  useEffect(() => setMounted(true), [])

  const close = useCallback(() => {
    setOpen(false)
    toggle.current?.focus()
  }, [])

  // biome-ignore lint/correctness/useExhaustiveDependencies: перешли на другую страницу — панель закрыта
  useEffect(() => setOpen(false), [pathname])

  useEffect(() => {
    if (!open) return
    const root = document.documentElement
    root.dataset.scrollLocked = 'true'
    function onPointer(event: PointerEvent) {
      const target = event.target
      if (!(target instanceof Node)) return
      if (layer.current?.contains(target) || toggle.current?.contains(target)) return
      setOpen(false)
    }
    document.addEventListener('pointerdown', onPointer)
    return () => {
      delete root.dataset.scrollLocked
      document.removeEventListener('pointerdown', onPointer)
    }
  }, [open])

  return (
    <>
      <div className={styles.inline}>
        <SearchBox variant="inline" hints={hints} whatsappHref={whatsappHref} />
      </div>
      <button
        ref={toggle}
        type="button"
        className={styles.toggle}
        aria-label="Поиск по каталогу"
        aria-expanded={open}
        onClick={() => setOpen((value) => !value)}
      >
        <Search size={20} strokeWidth={1.75} aria-hidden="true" />
      </button>
      {mounted &&
        open &&
        createPortal(
          <div ref={layer} className={styles.layer} role="dialog" aria-label="Поиск по каталогу">
            <div className={styles.frame}>
              <div className={styles.panel}>
                <SearchBox
                  variant="layer"
                  hints={hints}
                  whatsappHref={whatsappHref}
                  onClose={close}
                />
              </div>
            </div>
          </div>,
          document.body,
        )}
    </>
  )
}
