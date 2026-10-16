'use client'

import { MessageCircle } from 'lucide-react'
import { type PointerEventHandler, useState } from 'react'
import type { MenuTab } from '@/lib/navigation'
import type { PopularCardData } from '@/lib/popular'
import { MenuPopular } from '../MenuPopular/MenuPopular'
import { MenuSections } from '../MenuSections/MenuSections'
import styles from './MegaMenu.module.css'

type Props = {
  id: string
  tabs: MenuTab[]
  popular: PopularCardData[]
  onNavigate: () => void
  whatsappHref: string | null
  onPointerEnter: PointerEventHandler
  onPointerLeave: PointerEventHandler
}

/** Ключ вкладки «Популярные решения»: она первая и открыта сразу (решение владельца 16.10.2026). */
const POPULAR = 'popular'

/**
 * Мегаменю каталога. Слева на тёмной чертёжной сетке — «Популярные решения» и группы
 * (программы, оборудование, услуги), внизу предложение подбора; справа — плитки популярных
 * решений или разделы группы и товары раздела под курсором. Показывается одна вкладка за раз,
 * поэтому меню всегда помещается в экран.
 */
export function MegaMenu({
  id,
  tabs,
  popular,
  onNavigate,
  whatsappHref,
  onPointerEnter,
  onPointerLeave,
}: Props) {
  const segments = [
    ...(popular.length ? [{ key: POPULAR, label: 'Популярные решения' }] : []),
    ...tabs.map(({ key, label }) => ({ key, label })),
  ]
  const [active, setActive] = useState(segments[0]?.key ?? '')
  const current = segments.find((item) => item.key === active) ?? segments[0]
  if (!current) return null
  const tab = tabs.find((item) => item.key === current.key)
  return (
    <div
      id={id}
      className={styles.menu}
      onPointerEnter={onPointerEnter}
      onPointerLeave={onPointerLeave}
    >
      <div className={styles.rail}>
        <div className={styles.segments} role="tablist" aria-label="Группы каталога">
          {segments.map((item) => (
            <button
              key={item.key}
              type="button"
              role="tab"
              id={`${id}-tab-${item.key}`}
              aria-selected={item.key === current.key}
              aria-controls={`${id}-panel`}
              className={styles.segment}
              onClick={() => setActive(item.key)}
              onPointerEnter={(event) => event.pointerType === 'mouse' && setActive(item.key)}
            >
              {item.label}
            </button>
          ))}
        </div>
        <div className={styles.offer}>
          <p className={styles.offerTitle}>Не знаете, что выбрать?</p>
          <p className={styles.offerText}>
            Опишите задачи — поможем с выбором ПО или оборудования.
          </p>
          {whatsappHref && (
            <a href={whatsappHref} className={styles.offerLink} target="_blank" rel="noreferrer">
              <MessageCircle size={16} strokeWidth={1.75} aria-hidden="true" />
              Написать в WhatsApp
            </a>
          )}
        </div>
      </div>
      <div
        key={current.key}
        id={`${id}-panel`}
        role="tabpanel"
        aria-labelledby={`${id}-tab-${current.key}`}
        className={styles.panel}
      >
        {tab ? (
          <MenuSections tab={tab} onNavigate={onNavigate} />
        ) : (
          <MenuPopular cards={popular} onNavigate={onNavigate} />
        )}
      </div>
    </div>
  )
}
