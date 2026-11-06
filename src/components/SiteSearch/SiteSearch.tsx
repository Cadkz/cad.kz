'use client'

import { usePathname } from 'next/navigation'
import { useCallback, useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { OPEN_SITE_SEARCH_EVENT } from '@/lib/openSiteSearch'
import { useT } from '../LangProvider/LangProvider'
import { SearchBox } from '../SearchBox/SearchBox'
import styles from './SiteSearch.module.css'

type Props = {
  hints: readonly string[]
  typingHints: readonly string[]
  whatsappHref: string | null
}

/**
 * Поиск в шапке. От 640 px — широкое поле прямо в первой строке, забирает всё свободное место.
 * На телефоне поля в шапке нет (решение владельца 06.11.2026): поиск — первой строкой меню,
 * она шлёт событие OPEN_SITE_SEARCH_EVENT, и поиск открывается отдельным слоем на весь экран.
 * Слой выносится в body: у закреплённой шапки backdrop-filter, внутри неё fixed не работает.
 */
export function SiteSearch({ hints, typingHints, whatsappHref }: Props) {
  const t = useT()
  const [open, setOpen] = useState(false)
  const [mounted, setMounted] = useState(false)
  const pathname = usePathname()
  useEffect(() => setMounted(true), [])

  const close = useCallback(() => setOpen(false), [])

  useEffect(() => {
    const show = () => setOpen(true)
    window.addEventListener(OPEN_SITE_SEARCH_EVENT, show)
    return () => window.removeEventListener(OPEN_SITE_SEARCH_EVENT, show)
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
      {mounted &&
        open &&
        createPortal(
          <div className={styles.layer} role="dialog" aria-modal="true" aria-label={t('Поиск')}>
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
