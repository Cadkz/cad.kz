'use client'

import { Search } from 'lucide-react'
import { usePathname } from 'next/navigation'
import { useCallback, useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { HeaderAction } from '../HeaderAction/HeaderAction'
import { SearchBox } from '../SearchBox/SearchBox'
import styles from './SiteSearch.module.css'

type Props = {
  hints: readonly string[]
  typingHints: readonly string[]
  whatsappHref: string | null
}

/**
 * Поиск в шапке. От 640 px — широкое поле прямо в первой строке, забирает всё свободное место.
 * На телефоне — значок-лупа: открывает поиск отдельным слоем на весь экран.
 * Слой выносится в body: у закреплённой шапки backdrop-filter, внутри неё fixed не работает.
 */
export function SiteSearch({ hints, typingHints, whatsappHref }: Props) {
  const [open, setOpen] = useState(false)
  const [mounted, setMounted] = useState(false)
  const toggle = useRef<HTMLButtonElement>(null)
  const pathname = usePathname()
  useEffect(() => setMounted(true), [])

  const close = useCallback(() => {
    setOpen(false)
    toggle.current?.focus()
  }, [])

  // biome-ignore lint/correctness/useExhaustiveDependencies: перешли на другую страницу — слой закрыт
  useEffect(() => setOpen(false), [pathname])

  useEffect(() => {
    if (!open) return
    const root = document.documentElement
    root.dataset.scrollLocked = 'true'
    return () => {
      delete root.dataset.scrollLocked
    }
  }, [open])

  return (
    <>
      <div className={styles.inline}>
        <SearchBox
          variant="inline"
          hints={hints}
          typingHints={typingHints}
          whatsappHref={whatsappHref}
        />
      </div>
      <HeaderAction
        ref={toggle}
        className={styles.toggle}
        hideFrom="sm"
        icon={<Search size={20} strokeWidth={1.75} aria-hidden="true" />}
        ariaLabel="Поиск по каталогу"
        aria-expanded={open}
        onClick={() => setOpen(true)}
      />
      {mounted &&
        open &&
        createPortal(
          <div className={styles.layer} role="dialog" aria-modal="true" aria-label="Поиск">
            <SearchBox
              variant="layer"
              hints={hints}
              typingHints={typingHints}
              whatsappHref={whatsappHref}
              onClose={close}
            />
          </div>,
          document.body,
        )}
    </>
  )
}
