'use client'

import { ArrowRight, ChevronLeft } from 'lucide-react'
import Link from 'next/link'
import { useState } from 'react'
import { titleDash } from '@/domain/titleDash.mjs'
import type { MenuColumn } from '@/lib/navigation'
import { MenuChips } from '../MenuChips/MenuChips'
import { MenuTile } from '../MenuTile/MenuTile'
import { MenuTopPicks } from '../MenuTopPicks/MenuTopPicks'
import styles from './MenuDrill.module.css'

type Props = {
  column: MenuColumn
  /** Подпись ссылки на весь раздел: «Все программы направления», «Все 3D-сканеры». */
  allLabel: string
  onNavigate: () => void
}

/** «КРИСТАЛЛ - экспертиза элементов…» → только название: в карточке меню без пояснений. */
const shortTitle = (title: string) => titleDash(title, Number.POSITIVE_INFINITY)?.name ?? title

/**
 * Раздел меню по шагам: производители карточками → линейки производителя → товары линейки.
 * Шаг с единственным вариантом пропускается (у раздела один производитель, у производителя одна
 * линейка). Назад — по хлебным крошкам сверху.
 * У направлений программ (правка владельца 03.11.2026) производители — чипами по 3 в ряд, они
 * остаются сверху на всех шагах, а под ними сразу «Популярное» направления.
 */
export function MenuDrill({ column, allLabel, onNavigate }: Props) {
  const [vendorKey, setVendorKey] = useState<string | null>(null)
  const [lineKey, setLineKey] = useState<string | null>(null)
  const singleVendor = column.vendors.length === 1
  const vendor = singleVendor
    ? column.vendors[0]
    : column.vendors.find((item) => item.key === vendorKey)
  const chips = column.popular.length > 0 && !singleVendor
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

  // Ссылки «все товары» на каждом шаге: текущий уровень и, глубже, всё направление — чтобы
  // из любого места меню одним нажатием попасть ко всем товарам. Коротко, без повторов
  // названий (правка 02.11.2026): название шага и так стоит сверху в крошках.
  const all = [
    ...(line && !singleLine ? [{ href: line.allHref, label: 'Вся линейка' }] : []),
    ...(vendor && !singleVendor ? [{ href: vendor.allHref, label: `Всё от ${vendor.title}` }] : []),
    { href: column.allHref, label: allLabel },
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

      {chips && <MenuChips vendors={column.vendors} selected={vendorKey} onSelect={openVendor} />}

      {chips && !vendor && (
        <MenuTopPicks links={column.popular} titleOf={shortTitle} onNavigate={onNavigate} />
      )}

      {!chips && !vendor && (
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
                logo={link.logo ?? vendor?.logo}
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
