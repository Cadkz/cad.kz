'use client'

import { ArrowRight } from 'lucide-react'
import Link from 'next/link'
import { useState } from 'react'
import type { MenuTab } from '@/lib/navigation'
import styles from './MegaMenu.module.css'

type Props = {
  id: string
  tabs: MenuTab[]
  onNavigate: () => void
  whatsappHref: string | null
}

/** Мегаменю каталога: группы слева, товары по разделам в центре, предложение подбора справа. */
export function MegaMenu({ id, tabs, onNavigate, whatsappHref }: Props) {
  const [active, setActive] = useState(tabs[0]?.key ?? '')
  const tab = tabs.find((item) => item.key === active) ?? tabs[0]
  if (!tab) return null
  return (
    <div id={id} className={styles.menu}>
      <div className={styles.segments} role="tablist" aria-label="Группы каталога">
        {tabs.map((item) => (
          <button
            key={item.key}
            type="button"
            role="tab"
            id={`${id}-tab-${item.key}`}
            aria-selected={item.key === tab.key}
            aria-controls={`${id}-panel`}
            className={styles.segment}
            onClick={() => setActive(item.key)}
            onPointerEnter={(event) => event.pointerType === 'mouse' && setActive(item.key)}
          >
            {item.label}
          </button>
        ))}
      </div>
      <div
        id={`${id}-panel`}
        role="tabpanel"
        aria-labelledby={`${id}-tab-${tab.key}`}
        className={styles.panel}
      >
        <div className={styles.columns}>
          {tab.columns.map((column) => (
            <div key={column.title} className={styles.column}>
              <p className={styles.columnTitle}>{column.title}</p>
              <ul className={styles.links}>
                {column.links.map((link) => (
                  <li key={link.href}>
                    <Link href={link.href} className={styles.link} onClick={onNavigate}>
                      {link.title}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <Link href={tab.allHref} className={styles.all} onClick={onNavigate}>
          Весь список
          <ArrowRight size={16} strokeWidth={1.75} aria-hidden="true" />
        </Link>
      </div>
      <div className={styles.visual}>
        <p className={styles.visualTitle}>Подберём комплект под ваши задачи</p>
        <p className={styles.visualText}>
          Пришлите список задач — инженер предложит софт и технику.
        </p>
        {whatsappHref && (
          <a href={whatsappHref} className={styles.visualLink} target="_blank" rel="noreferrer">
            Написать в WhatsApp
          </a>
        )}
      </div>
    </div>
  )
}
