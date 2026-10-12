'use client'

import { ArrowRight, ChevronDown } from 'lucide-react'
import Link from 'next/link'
import { useId, useState } from 'react'
import type { Direction } from '@/lib/catalog'
import { catalogHref } from '@/lib/navigationHrefs'
import { SectionIcon } from '../SectionIcon/SectionIcon'
import styles from './DirectionIndex.module.css'

/** На телефоне сначала столько направлений, остальные — по кнопке «Все направления». */
const FIRST = 6

type Item = Pick<Direction, 'slug' | 'href' | 'title' | 'summary' | 'icon'>

/**
 * Направления на главной — светлый указатель каталога: значок, название, коротко, стрелка,
 * тонкие линии между пунктами. От 960 px три колонки, от 640 — две, на телефоне одна:
 * первые шесть и кнопка, открывающая остальные (от 640 px видны все, кнопки нет).
 */
export function DirectionIndex({ items }: { items: Item[] }) {
  const [open, setOpen] = useState(false)
  const listId = useId()
  const hasMore = items.length > FIRST
  return (
    <div>
      <ul id={listId} className={open ? `${styles.list} ${styles.open}` : styles.list}>
        {items.map((item, i) => (
          <li key={item.slug} className={i >= FIRST ? styles.extra : undefined}>
            <Link href={item.href ?? catalogHref({ direction: item.slug })} className={styles.link}>
              <span className={styles.icon}>
                <SectionIcon name={item.icon} size={20} />
              </span>
              <span className={styles.text}>
                <span className={styles.title}>{item.title}</span>
                {item.summary && <span className={styles.summary}>{item.summary}</span>}
              </span>
              <ArrowRight
                size={20}
                strokeWidth={1.75}
                aria-hidden="true"
                className={styles.arrow}
              />
            </Link>
          </li>
        ))}
      </ul>
      {hasMore && (
        <button
          type="button"
          className={styles.more}
          aria-expanded={open}
          aria-controls={listId}
          onClick={() => setOpen((v) => !v)}
        >
          {open ? 'Свернуть' : 'Все направления'}
          <ChevronDown size={20} strokeWidth={1.75} aria-hidden="true" className={styles.chevron} />
        </button>
      )}
    </div>
  )
}
