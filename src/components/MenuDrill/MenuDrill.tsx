'use client'

import { ArrowRight, ChevronLeft } from 'lucide-react'
import Link from 'next/link'
import { useState } from 'react'
import type { MenuColumn } from '@/lib/navigation'
import { MenuTile } from '../MenuTile/MenuTile'
import styles from './MenuDrill.module.css'

type Props = { column: MenuColumn; onNavigate: () => void }

/** «КРИСТАЛЛ - экспертиза элементов…» → только название: в карточке меню без пояснений. */
const shortTitle = (title: string) => title.match(/^(.+?)\s+[-–—]\s+.+$/)?.[1] ?? title

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

  // Ссылки «все товары» на каждом шаге: текущий уровень и, глубже, весь раздел — чтобы
  // из любого места меню одним нажатием попасть ко всем товарам направления.
  const all = [
    ...(line && !singleLine
      ? [{ href: line.allHref, label: `Все товары линейки ${line.title}` }]
      : []),
    ...(vendor && !singleVendor
      ? [{ href: vendor.allHref, label: `Все товары ${vendor.title} в разделе` }]
      : []),
    { href: column.allHref, label: `Все товары раздела «${column.title}»` },
  ]

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
              <MenuTile
                title={item.title}
                logo={item.logo}
                icon={item.icon}
                onClick={() => openVendor(item.key)}
              />
            </li>
          ))}
        </ul>
      )}

      {!vendor && column.popular.length > 0 && (
        <section className={styles.popular} aria-label="Популярное в разделе">
          <p className={styles.popularTitle}>Популярное в разделе</p>
          <ul className={styles.popularList}>
            {column.popular.map((link) => (
              <li key={link.href}>
                <Link href={link.href} className={styles.popularLink} onClick={onNavigate}>
                  {shortTitle(link.title)}
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}

      {vendor && !line && (
        <ul className={styles.cards}>
          {vendor.lines.map((item) => (
            <li key={item.key}>
              <MenuTile
                title={item.title}
                logo={vendor.logo}
                icon={vendor.icon}
                onClick={() => setLineKey(item.key)}
              />
            </li>
          ))}
        </ul>
      )}

      {line && (
        <ul className={styles.cards}>
          {line.links.map((link) => (
            <li key={link.href}>
              <MenuTile
                title={shortTitle(link.title)}
                logo={vendor?.logo}
                icon={vendor?.icon}
                href={link.href}
                onClick={onNavigate}
              />
            </li>
          ))}
        </ul>
      )}

      <div className={styles.allLinks}>
        {all.map((item) => (
          <Link key={item.href} href={item.href} className={styles.all} onClick={onNavigate}>
            {item.label}
            <ArrowRight size={16} strokeWidth={1.75} aria-hidden="true" />
          </Link>
        ))}
      </div>
    </div>
  )
}
