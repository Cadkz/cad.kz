'use client'

import { MessageCircle } from 'lucide-react'
import { type PointerEventHandler, useState } from 'react'
import type { MenuTab } from '@/lib/navigation'
import { MenuSections } from '../MenuSections/MenuSections'
import styles from './MegaMenu.module.css'

type Props = {
  id: string
  tabs: MenuTab[]
  onNavigate: () => void
  whatsappHref: string | null
  onPointerEnter: PointerEventHandler
  onPointerLeave: PointerEventHandler
}

/**
 * Мегаменю каталога. Слева на тёмной чертёжной сетке — группы (программы, оборудование, услуги)
 * и предложение подбора; дальше разделы группы и популярные товары раздела под курсором.
 * Показывается один раздел за раз, поэтому меню всегда помещается в экран.
 */
export function MegaMenu({
  id,
  tabs,
  onNavigate,
  whatsappHref,
  onPointerEnter,
  onPointerLeave,
}: Props) {
  const [active, setActive] = useState(tabs[0]?.key ?? '')
  const tab = tabs.find((item) => item.key === active) ?? tabs[0]
  if (!tab) return null
  return (
    <div
      id={id}
      className={styles.menu}
      onPointerEnter={onPointerEnter}
      onPointerLeave={onPointerLeave}
    >
      <div className={styles.rail}>
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
        <div className={styles.offer}>
          <p className={styles.offerTitle}>Не знаете, что выбрать?</p>
          <p className={styles.offerText}>
            Пришлите задачи — инженер подберёт программы и технику.
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
        key={tab.key}
        id={`${id}-panel`}
        role="tabpanel"
        aria-labelledby={`${id}-tab-${tab.key}`}
        className={styles.panel}
      >
        <MenuSections tab={tab} onNavigate={onNavigate} />
      </div>
    </div>
  )
}
