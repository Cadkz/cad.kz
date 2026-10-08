'use client'

import { ChevronDown } from 'lucide-react'
import Link from 'next/link'
import {
  type ReactNode,
  type PointerEvent as ReactPointerEvent,
  useCallback,
  useEffect,
  useRef,
  useState,
} from 'react'
import type { MenuTab } from '@/lib/navigation'
import { aboutColumns, newsLinks, plainLinks } from '@/lib/siteNav'
import { MegaMenu } from '../MegaMenu/MegaMenu'
import styles from './MainNav.module.css'

type Key = 'catalog' | 'news' | 'about'
type Props = { menu: MenuTab[]; whatsappHref: string | null; aboutExtra: ReactNode }

/** Основное меню для экранов от 960 px. Открывается кликом или наведением, Escape закрывает. */
export function MainNav({ menu, whatsappHref, aboutExtra }: Props) {
  const [open, setOpen] = useState<Key | null>(null)
  const root = useRef<HTMLDivElement>(null)
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined)
  // Когда меню только что открылось наведением, клик по той же кнопке не должен его закрыть.
  const hoveredAt = useRef(0)
  const close = useCallback(() => setOpen(null), [])

  useEffect(() => {
    if (!open) return
    function onPointer(event: PointerEvent) {
      if (event.target instanceof Node && !root.current?.contains(event.target)) setOpen(null)
    }
    function onKey(event: KeyboardEvent) {
      if (event.key !== 'Escape') return
      root.current?.querySelector<HTMLElement>(`[data-key="${open}"]`)?.focus()
      setOpen(null)
    }
    document.addEventListener('pointerdown', onPointer)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('pointerdown', onPointer)
      document.removeEventListener('keydown', onKey)
    }
  }, [open])

  function hover(key: Key | null) {
    return (event: ReactPointerEvent) => {
      if (event.pointerType !== 'mouse') return
      clearTimeout(timer.current)
      if (key) {
        if (open !== key) hoveredAt.current = Date.now()
        setOpen(key)
      } else timer.current = setTimeout(() => setOpen(null), 200)
    }
  }

  function trigger(key: Key, label: string) {
    return (
      <button
        type="button"
        data-key={key}
        className={styles.item}
        aria-expanded={open === key}
        aria-controls={`nav-${key}`}
        onClick={() => {
          if (open === key && Date.now() - hoveredAt.current < 600) return
          setOpen(open === key ? null : key)
        }}
      >
        {label}
        <ChevronDown size={16} strokeWidth={1.75} className={styles.chevron} aria-hidden="true" />
      </button>
    )
  }

  return (
    <div ref={root} className={styles.root}>
      <nav className={styles.nav} aria-label="Основное меню" onPointerLeave={hover(null)}>
        <div onPointerEnter={hover('catalog')}>{trigger('catalog', 'Каталог')}</div>
        <div className={styles.dropWrap} onPointerEnter={hover('news')}>
          {trigger('news', 'Новости')}
          {open === 'news' && (
            <ul id="nav-news" className={styles.dropdown}>
              {newsLinks.map((link) => (
                <li key={link.href}>
                  <Link href={link.href} className={styles.dropLink} onClick={close}>
                    {link.title}
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>
        {plainLinks.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            className={styles.item}
            onPointerEnter={hover(null)}
          >
            {link.title}
          </Link>
        ))}
        <div className={styles.dropWrap} onPointerEnter={hover('about')}>
          {trigger('about', 'О компании')}
          {open === 'about' && (
            <div id="nav-about" className={`${styles.dropdown} ${styles.flyout}`}>
              {aboutColumns.map((column) => (
                <div key={column.title} className={styles.flyoutCol}>
                  <p className={styles.flyoutTitle}>{column.title}</p>
                  {column.links.map((link) => (
                    <a key={link.href} href={link.href} className={styles.dropLink}>
                      {link.title}
                    </a>
                  ))}
                </div>
              ))}
              <div className={`${styles.flyoutCol} ${styles.flyoutContacts}`}>
                <p className={styles.flyoutTitle}>Контакты</p>
                {aboutExtra}
              </div>
            </div>
          )}
        </div>
      </nav>
      {open === 'catalog' && (
        <div onPointerEnter={hover('catalog')} onPointerLeave={hover(null)}>
          <MegaMenu id="nav-catalog" tabs={menu} onNavigate={close} whatsappHref={whatsappHref} />
        </div>
      )}
    </div>
  )
}
