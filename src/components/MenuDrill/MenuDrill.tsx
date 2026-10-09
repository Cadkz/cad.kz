'use client'

import { ArrowRight, ChevronLeft } from 'lucide-react'
import Link from 'next/link'
import { useState } from 'react'
import type { MenuColumn, MenuLine, MenuVendor } from '@/lib/navigation'
import styles from './MenuDrill.module.css'

type Props = { column: MenuColumn; onNavigate: () => void }

/** «КРИСТАЛЛ - экспертиза элементов…» → название и пояснение отдельно. */
function splitTitle(title: string): [string, string | null] {
  const match = title.match(/^(.+?)\s+[-–—]\s+(.+)$/)
  return match ? [match[1], match[2]] : [title, null]
}

/** Подсказка под карточкой: линейки производителя или первые товары. */
function vendorHint(vendor: MenuVendor) {
  if (vendor.lines.length > 1) return vendor.lines.map((line) => line.title).join(' · ')
  return lineHint(vendor.lines[0])
}

function lineHint(line: MenuLine | undefined) {
  return (line?.links ?? [])
    .slice(0, 3)
    .map((link) => splitTitle(link.title)[0])
    .join(' · ')
}

/**
 * Раздел меню по шагам: производители карточками → линейки производителя → товары линейки.
 * Шаг с единственным вариантом пропускается (у раздела один производитель, у производителя одна
 * линейка). Назад — по хлебным крошкам сверху.
 */
export function MenuDrill({ column, onNavigate }: Props) {
  const [vendorKey, setVendorKey] = useState<string | null>(null)
  const [lineKey, setLineKey] = useState<string | null>(null)
  const singleVendor = column.vendors.length === 1
  const vendor = singleVendor
    ? column.vendors[0]
    : column.vendors.find((item) => item.key === vendorKey)
  const singleLine = vendor?.lines.length === 1
  const line = singleLine ? vendor?.lines[0] : vendor?.lines.find((item) => item.key === lineKey)

  const openVendor = (key: string | null) => {
    setVendorKey(key)
    setLineKey(null)
  }

  const crumbs = [
    { title: column.title, back: vendor && !singleVendor ? () => openVendor(null) : null },
    ...(vendor && !(singleVendor && singleLine && line)
      ? [{ title: vendor.title, back: line && !singleLine ? () => setLineKey(null) : null }]
      : []),
    ...(line && !singleLine ? [{ title: line.title, back: null }] : []),
  ]

  const all = line
    ? { href: line.allHref, label: 'Смотреть все' }
    : vendor
      ? { href: vendor.allHref, label: `Все товары ${vendor.title} в разделе` }
      : { href: column.allHref, label: 'Смотреть весь раздел' }

  return (
    <div className={styles.root}>
      <nav className={styles.crumbs} aria-label="Путь в меню">
        {crumbs.map((crumb, index) =>
          crumb.back ? (
            <button key={crumb.title} type="button" className={styles.back} onClick={crumb.back}>
              {index === 0 && <ChevronLeft size={16} strokeWidth={1.75} aria-hidden="true" />}
              {crumb.title}
            </button>
          ) : (
            <span key={crumb.title} className={styles.current}>
              {crumb.title}
            </span>
          ),
        )}
      </nav>

      {!vendor && (
        <ul className={styles.cards}>
          {column.vendors.map((item) => (
            <li key={item.key}>
              <button type="button" className={styles.card} onClick={() => openVendor(item.key)}>
                <span className={styles.cardTitle}>{item.title}</span>
                <span className={styles.hint}>{vendorHint(item)}</span>
              </button>
            </li>
          ))}
        </ul>
      )}

      {vendor && !line && (
        <ul className={styles.cards}>
          {vendor.lines.map((item) => (
            <li key={item.key}>
              <button type="button" className={styles.card} onClick={() => setLineKey(item.key)}>
                <span className={styles.cardTitle}>{item.title}</span>
                <span className={styles.hint}>{lineHint(item)}</span>
              </button>
            </li>
          ))}
        </ul>
      )}

      {line && (
        <ul className={styles.cards}>
          {line.links.map((link) => {
            const [name, note] = splitTitle(link.title)
            return (
              <li key={link.href}>
                <Link href={link.href} className={styles.card} onClick={onNavigate}>
                  <span className={styles.cardTitle}>{name}</span>
                  {note && <span className={styles.hint}>{note}</span>}
                </Link>
              </li>
            )
          })}
        </ul>
      )}

      <Link href={all.href} className={styles.all} onClick={onNavigate}>
        {all.label}
        <ArrowRight size={16} strokeWidth={1.75} aria-hidden="true" />
      </Link>
    </div>
  )
}
