'use client'

import { type ReactNode, useId, useState } from 'react'
import styles from './ProductTabs.module.css'

type Tab = { id: string; title: string; content: ReactNode }

/**
 * Вкладки страницы оборудования «Обзор / Характеристики» (24.10.2026). Обе панели в разметке
 * сразу — поисковики видят и описание, и характеристики; переключатель только прячет одну.
 * Стрелки влево и вправо переключают вкладки, как у обычного переключателя.
 */
export function ProductTabs({ tabs, label }: { tabs: Tab[]; label: string }) {
  const [active, setActive] = useState(tabs[0]?.id)
  const base = useId()
  const move = (step: number) => {
    const at = tabs.findIndex((tab) => tab.id === active)
    const next = tabs[(at + step + tabs.length) % tabs.length]
    if (!next) return
    setActive(next.id)
    document.getElementById(`${base}-${next.id}-tab`)?.focus()
  }
  return (
    <section className={styles.wrap} id="about" aria-label={label}>
      <div className={styles.tabs} role="tablist" aria-label={label}>
        {tabs.map((tab) => (
          <button
            key={tab.id}
            type="button"
            role="tab"
            id={`${base}-${tab.id}-tab`}
            aria-controls={`${base}-${tab.id}`}
            aria-selected={tab.id === active}
            tabIndex={tab.id === active ? 0 : -1}
            className={styles.tab}
            onClick={() => setActive(tab.id)}
            onKeyDown={(event) => {
              if (event.key === 'ArrowRight') move(1)
              if (event.key === 'ArrowLeft') move(-1)
            }}
          >
            {tab.title}
          </button>
        ))}
      </div>
      {tabs.map((tab) => (
        <div
          key={tab.id}
          role="tabpanel"
          id={`${base}-${tab.id}`}
          aria-labelledby={`${base}-${tab.id}-tab`}
          hidden={tab.id !== active}
          className={styles.panel}
        >
          {tab.content}
        </div>
      ))}
    </section>
  )
}
