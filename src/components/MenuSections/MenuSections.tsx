'use client'

import { ArrowRight } from 'lucide-react'
import Link from 'next/link'
import { useEffect, useRef, useState } from 'react'
import type { MenuTab } from '@/lib/navigation'
import { SectionIcon } from '../SectionIcon/SectionIcon'
import styles from './MenuSections.module.css'

type Props = { tab: MenuTab; onNavigate: () => void }

/** Задержка смены раздела при наведении: мышь, идущая по диагонали к товарам, не переключает раздел. */
const HOVER_DELAY = 90

/**
 * Разделы группы и популярные товары выбранного раздела (сначала флагманы и топы продаж).
 * Раздел — ссылка в каталог: наведение или фокус показывают его товары, клик открывает каталог.
 */
export function MenuSections({ tab, onNavigate }: Props) {
  const [active, setActive] = useState(0)
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined)
  useEffect(() => () => clearTimeout(timer.current), [])
  const column = tab.columns[active] ?? tab.columns[0]
  if (!column) return null

  const preview = (index: number, delay = 0) => {
    clearTimeout(timer.current)
    if (delay) timer.current = setTimeout(() => setActive(index), delay)
    else setActive(index)
  }

  return (
    <div className={styles.root}>
      <ul className={styles.sections}>
        {tab.columns.map((item, index) => (
          <li key={item.title}>
            <Link
              href={item.allHref ?? tab.allHref}
              className={styles.section}
              aria-current={index === active ? 'true' : undefined}
              onClick={onNavigate}
              onFocus={() => preview(index)}
              onPointerEnter={(event) =>
                event.pointerType === 'mouse' && preview(index, HOVER_DELAY)
              }
              onPointerLeave={() => clearTimeout(timer.current)}
            >
              <span className={styles.icon}>
                <SectionIcon name={item.icon} size={16} />
              </span>
              <span className={styles.sectionTitle}>{item.title}</span>
              <span className={styles.count}>{item.total}</span>
            </Link>
          </li>
        ))}
        <li>
          <Link href={tab.allHref} className={styles.everything} onClick={onNavigate}>
            Весь раздел «{tab.label}»
            <ArrowRight size={16} strokeWidth={1.75} aria-hidden="true" />
          </Link>
        </li>
      </ul>
      <div key={column.title} className={styles.products}>
        <p className={styles.heading}>
          {column.title}
          <span className={styles.note}>Сначала то, что чаще покупают</span>
        </p>
        <ul className={styles.list}>
          {column.links.map((link) => (
            <li key={link.href}>
              <Link href={link.href} className={styles.product} onClick={onNavigate}>
                <span className={styles.productTitle}>{link.title}</span>
                {link.vendor && <span className={styles.vendor}>{link.vendor}</span>}
              </Link>
            </li>
          ))}
        </ul>
        {column.allHref && (
          <Link href={column.allHref} className={styles.all} onClick={onNavigate}>
            Все {column.total} в каталоге
            <ArrowRight size={16} strokeWidth={1.75} aria-hidden="true" />
          </Link>
        )}
      </div>
    </div>
  )
}
