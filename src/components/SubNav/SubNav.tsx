'use client'

import { ChevronDown, Phone } from 'lucide-react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  type ReactNode,
  type PointerEvent as ReactPointerEvent,
  useEffect,
  useRef,
  useState,
} from 'react'
import { aboutColumns, sectionLinks } from '@/lib/siteNav'
import { Container } from '../Container/Container'
import styles from './SubNav.module.css'

type Props = { phone: { label: string; tel: string } | null; contacts: ReactNode }

/**
 * Вторая строка шапки (от 960 px): разделы сайта, «О компании» с двумя группами и контактами,
 * справа основной телефон. Тише первой строки: мельче, серым, без рамок. При прокрутке уезжает
 * вместе со страницей — закреплена только первая строка.
 */
export function SubNav({ phone, contacts }: Props) {
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
    <div className={styles.subnav}>
      <Container className={styles.row}>
        <nav aria-label="Разделы сайта" className={styles.nav}>
          {sectionLinks.map((link) => (
            <Link key={link.href} href={link.href} className={styles.item}>
              {link.title}
            </Link>
          ))}
          <div
            ref={root}
            className={styles.dropWrap}
            onPointerEnter={hover(true)}
            onPointerLeave={hover(false)}
          >
            <button
              ref={button}
              type="button"
              className={styles.item}
              aria-expanded={open}
              aria-controls="nav-about"
              onClick={() => setOpen(!open)}
            >
              О компании
              <ChevronDown
                size={16}
                strokeWidth={1.75}
                className={styles.chevron}
                aria-hidden="true"
              />
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
        </nav>
        {phone && (
          <a href={`tel:${phone.tel}`} className={styles.phone}>
            <Phone size={16} strokeWidth={1.75} aria-hidden="true" />
            {phone.label}
          </a>
        )}
      </Container>
    </div>
  )
}
