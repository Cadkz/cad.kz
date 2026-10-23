'use client'

import { Phone } from 'lucide-react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  type FocusEvent,
  type ReactNode,
  type PointerEvent as ReactPointerEvent,
  useEffect,
  useState,
} from 'react'
import { activeLinkIndex, markMotion } from '@/domain/navMark.mjs'
import { aboutColumns, sectionLinks } from '@/lib/siteNav'
import { Container } from '../Container/Container'
import { SubNavAbout } from '../SubNavAbout/SubNavAbout'
import styles from './SubNav.module.css'

type Props = { phone: { label: string; tel: string } | null; contacts: ReactNode }
type Motion = ReturnType<typeof markMotion>
type Mark = { hovered: number | null; line: Motion; pill: Motion }

const ABOUT = sectionLinks.length
const aboutLinks = aboutColumns.flatMap((column) => column.links)

/** Пункт под указателем или в фокусе: ближайший предок с data-index внутри строки. */
function itemIndex(target: EventTarget | null): number | null {
  if (!(target instanceof Element)) return null
  const item = target.closest('[data-index]')
  return item instanceof HTMLElement ? Number(item.dataset.index) : null
}

/**
 * Вторая строка шапки (от 960 px): разделы сайта, «О компании» с двумя группами и контактами,
 * справа основной телефон. Тише первой строки: мельче, серым, без рамок. При прокрутке уезжает
 * вместе со страницей — закреплена только первая строка.
 *
 * Жидкая метка (24.10.2026): под открытым разделом — линия; при наведении линия и мягкая подложка
 * перетекают к пункту под указателем — передний край быстро, задний догоняет с отдачей. Здесь
 * только выбор пункта и направления, движение — в CSS (якоря anchor-name).
 */
export function SubNav({ phone, contacts }: Props) {
  const pathname = usePathname()
  const [search, setSearch] = useState('')
  const [mark, setMark] = useState<Mark>({ hovered: null, line: 'still', pill: 'still' })

  // Параметры адреса берутся после загрузки: на сервере их нет, а «Акции» — это /news?kind=promotion.
  // biome-ignore lint/correctness/useExhaustiveDependencies: параметры обновляются вместе со страницей
  useEffect(() => setSearch(window.location.search), [pathname])

  const sectionActive = activeLinkIndex(sectionLinks, pathname, search)
  const aboutActive = activeLinkIndex(aboutLinks, pathname, '') === null ? null : ABOUT
  const active = sectionActive ?? aboutActive

  // Открыли другой раздел, пока указатель не над строкой: линия заново прорисовывается под ним.
  // biome-ignore lint/correctness/useExhaustiveDependencies: эффект запускается сменой раздела
  useEffect(() => {
    setMark((prev) => (prev.hovered === null ? { ...prev, line: 'enter' } : prev))
  }, [active])

  function point(next: number | null) {
    setMark((prev) => {
      if (prev.hovered === next) return prev
      return {
        hovered: next,
        line: markMotion(prev.hovered ?? active, next ?? active),
        pill: markMotion(prev.hovered, next),
      }
    })
  }

  // Промежутки между пунктами не сбрасывают метку: она уходит, только когда указатель покинул строку.
  const onPointerOver = (event: ReactPointerEvent) => {
    const index = itemIndex(event.target)
    if (index !== null) point(index)
  }
  const onBlur = (event: FocusEvent) => {
    if (!event.currentTarget.contains(event.relatedTarget)) point(null)
  }

  const lineAt = mark.hovered ?? active
  const attrs = (index: number) => ({
    'data-index': index,
    'data-line': lineAt === index,
    'data-pill': mark.hovered === index,
  })

  return (
    <div className={styles.subnav}>
      <Container className={styles.row}>
        <nav
          aria-label="Разделы сайта"
          className={styles.nav}
          data-line={mark.line}
          data-pill={mark.pill}
          data-lit={lineAt !== null}
          data-hover={mark.hovered !== null}
          onPointerOver={onPointerOver}
          onPointerLeave={() => point(null)}
          onFocus={(event) => point(itemIndex(event.target))}
          onBlur={onBlur}
        >
          {sectionLinks.map((link, index) => (
            <Link
              key={link.href}
              href={link.href}
              className={styles.item}
              aria-current={active === index ? 'page' : undefined}
              {...attrs(index)}
            >
              {link.title}
            </Link>
          ))}
          <SubNavAbout
            index={ABOUT}
            line={lineAt === ABOUT}
            pill={mark.hovered === ABOUT}
            itemClassName={styles.item}
            contacts={contacts}
          />
          <span className={styles.pill} aria-hidden="true" />
          <span className={styles.line} aria-hidden="true" />
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
