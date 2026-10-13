'use client'

import { MessageCircle } from 'lucide-react'
import { type PointerEventHandler, useState } from 'react'
import type { Menu } from '@/lib/navigation'
import { catalogHref } from '@/lib/navigationHrefs'
import { MenuCard } from '../MenuCard/MenuCard'
import { MenuPanel } from '../MenuPanel/MenuPanel'
import { MenuSections } from '../MenuSections/MenuSections'
import styles from './MegaMenu.module.css'

type Props = {
  id: string
  menu: Menu
  onNavigate: () => void
  whatsappHref: string | null
  onPointerEnter: PointerEventHandler
  onPointerLeave: PointerEventHandler
}

const VENDORS = 'vendors'

/**
 * Мегаменю каталога (вариант А, 13.10.2026). Слева на тёмной чертёжной сетке — группы (программы,
 * оборудование, услуги, производители) и предложение подбора; дальше разделы группы по задачам
 * и программы раздела под курсором. У программ сверху «Популярные программы».
 * Показывается один раздел за раз, поэтому меню всегда помещается в экран.
 */
export function MegaMenu({
  id,
  menu,
  onNavigate,
  whatsappHref,
  onPointerEnter,
  onPointerLeave,
}: Props) {
  const tabs = [
    ...menu.tabs.map(({ key, label }) => ({ key, label })),
    ...(menu.vendors.length ? [{ key: VENDORS, label: 'Производители' }] : []),
  ]
  const [active, setActive] = useState(tabs[0]?.key ?? '')
  const tab = tabs.find((item) => item.key === active) ?? tabs[0]
  if (!tab) return null
  const group = menu.tabs.find((item) => item.key === tab.key)
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
        key={tab.key}
        id={`${id}-panel`}
        role="tabpanel"
        aria-labelledby={`${id}-tab-${tab.key}`}
        className={styles.panel}
      >
        {group ? (
          <MenuSections
            tab={group}
            popular={group.key === 'software' ? menu.popular : []}
            onNavigate={onNavigate}
          />
        ) : (
          <MenuPanel
            title="Производители"
            columns={3}
            footer={[{ href: catalogHref(), label: 'Весь каталог' }]}
            onNavigate={onNavigate}
          >
            {menu.vendors.map((vendor) => (
              <MenuCard
                key={vendor.href}
                title={vendor.title}
                hint={vendor.hint}
                href={vendor.href}
                onNavigate={onNavigate}
              />
            ))}
          </MenuPanel>
        )}
      </div>
    </div>
  )
}
