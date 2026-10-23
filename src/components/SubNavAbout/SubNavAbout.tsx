'use client'

import { ChevronDown } from 'lucide-react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  type ReactNode,
  type PointerEvent as ReactPointerEvent,
  useEffect,
  useRef,
  useState,
} from 'react'
import { aboutColumns } from '@/lib/siteNav'
import styles from './SubNavAbout.module.css'

type Props = {
  /** Номер пункта во второй строке — по нему SubNav ведёт жидкую метку. */
  index: number
  /** Метка-линия и подложка сейчас у этого пункта (атрибуты задают якорь для CSS). */
  line: boolean
  pill: boolean
  /** Класс пункта из SubNav — тот же вид, что у соседних ссылок. */
  itemClassName: string
  contacts: ReactNode
}

/**
 * «О компании» во второй строке шапки: панель из трёх колонок (Компания, Покупателям, Связаться).
 * Открывается наведением мышью или нажатием, раскрывается шторкой сверху вниз, как мегаменю
 * каталога; колонки проступают по очереди.
 */
export function SubNavAbout({ index, line, pill, itemClassName, contacts }: Props) {
  const [open, setOpen] = useState(false)
  const root = useRef<HTMLDivElement>(null)
  const button = useRef<HTMLButtonElement>(null)
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined)
  const pathname = usePathname()

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

  const hover = (next: boolean) => (event: ReactPointerEvent) => {
    if (event.pointerType !== 'mouse') return
    clearTimeout(timer.current)
    if (next) setOpen(true)
    else timer.current = setTimeout(() => setOpen(false), 200)
  }

  return (
    <div
      ref={root}
      className={styles.wrap}
      data-index={index}
      onPointerEnter={hover(true)}
      onPointerLeave={hover(false)}
    >
      <button
        ref={button}
        type="button"
        className={itemClassName}
        data-line={line}
        data-pill={pill}
        aria-expanded={open}
        aria-controls="nav-about"
        onClick={() => setOpen(!open)}
      >
        О компании
        <ChevronDown size={16} strokeWidth={1.75} className={styles.chevron} aria-hidden="true" />
      </button>
      <div id="nav-about" className={styles.dropdown} data-open={open} inert={!open}>
        {aboutColumns.map((column) => (
          <div key={column.title} className={styles.column}>
            <p className={styles.columnTitle}>{column.title}</p>
            {column.links.map((link) => (
              <Link key={link.href} href={link.href} className={styles.dropLink}>
                {link.title}
              </Link>
            ))}
          </div>
        ))}
        <div className={`${styles.column} ${styles.contacts}`}>
          <p className={styles.columnTitle}>Связаться</p>
          {contacts}
        </div>
      </div>
    </div>
  )
}
