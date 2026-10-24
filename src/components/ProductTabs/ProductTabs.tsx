'use client'

import { FileText, ListChecks } from 'lucide-react'
import { type ReactNode, useEffect, useId, useRef, useState } from 'react'
import styles from './ProductTabs.module.css'

type Tab = { id: 'overview' | 'specs'; title: string; count?: number; content: ReactNode }

const icons = { overview: FileText, specs: ListChecks }

/**
 * Вкладки страницы товара «Обзор / Характеристики» (24.10.2026), у программ и оборудования.
 * Обе панели в разметке сразу — поисковики видят и описание, и характеристики; переключатель
 * только прячет одну. Строка вкладок стоит на месте (владелец: липкая наезжала на текст).
 * Белая подложка перетекает к
 * выбранной вкладке, как жидкая метка второй строки шапки: передний край быстрее заднего.
 * Стрелки влево и вправо переключают вкладки, как у обычного переключателя.
 */
export function ProductTabs({ tabs, label }: { tabs: Tab[]; label: string }) {
  const [active, setActive] = useState(tabs[0]?.id)
  const base = useId()
  const section = useRef<HTMLElement>(null)
  const list = useRef<HTMLDivElement>(null)

  // Подложка — один элемент на строку: края берём у выбранной вкладки, направление — по
  // тому, в какую сторону переключили (CSS даёт переднему краю короткое время, заднему — длинное).
  useEffect(() => {
    const row = list.current
    if (!row) return
    const place = () => {
      const tab = document.getElementById(`${base}-${active}-tab`)
      if (!tab) return
      const left = tab.offsetLeft
      const right = row.clientWidth - left - tab.offsetWidth
      const before = Number.parseFloat(row.style.getPropertyValue('--pill-left') || '0')
      row.dataset.dir = left > before ? 'right' : left < before ? 'left' : 'still'
      row.style.setProperty('--pill-left', `${left}px`)
      row.style.setProperty('--pill-right', `${right}px`)
      row.dataset.ready = 'true'
    }
    place()
    const observer = new ResizeObserver(place)
    observer.observe(row)
    return () => observer.disconnect()
  }, [active, base])

  const choose = (id: Tab['id']) => {
    setActive(id)
    // Переключили внизу длинного обзора — показываем новую вкладку с начала.
    const top = section.current?.getBoundingClientRect().top ?? 0
    if (top < 0) section.current?.scrollIntoView({ block: 'start' })
  }

  const move = (step: number) => {
    const at = tabs.findIndex((tab) => tab.id === active)
    const next = tabs[(at + step + tabs.length) % tabs.length]
    if (!next) return
    choose(next.id)
    document.getElementById(`${base}-${next.id}-tab`)?.focus()
  }

  return (
    <section ref={section} className={styles.wrap} id="about" aria-label={label}>
      <div className={styles.bar}>
        <div ref={list} className={styles.tabs} role="tablist" aria-label={label}>
          <span className={styles.pill} aria-hidden="true" />
          {tabs.map((tab) => {
            const Icon = icons[tab.id]
            return (
              <button
                key={tab.id}
                type="button"
                role="tab"
                id={`${base}-${tab.id}-tab`}
                aria-controls={`${base}-${tab.id}`}
                aria-selected={tab.id === active}
                tabIndex={tab.id === active ? 0 : -1}
                className={styles.tab}
                onClick={() => choose(tab.id)}
                onKeyDown={(event) => {
                  if (event.key === 'ArrowRight') move(1)
                  if (event.key === 'ArrowLeft') move(-1)
                }}
              >
                <Icon size={20} strokeWidth={1.75} aria-hidden="true" />
                {tab.title}
                {tab.count ? <span className={styles.count}>{tab.count}</span> : null}
              </button>
            )
          })}
        </div>
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
