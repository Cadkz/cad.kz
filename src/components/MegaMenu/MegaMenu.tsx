'use client'

import { MessageCircle } from 'lucide-react'
import { type PointerEventHandler, useEffect, useRef, useState } from 'react'
import { POPULAR_LABEL } from '@/domain/catalogNavigation.mjs'
import type { MenuTab } from '@/lib/navigation'
import type { PopularCardData } from '@/lib/popular'
import { MenuPopular } from '../MenuPopular/MenuPopular'
import { MenuSections } from '../MenuSections/MenuSections'
import styles from './MegaMenu.module.css'

type Props = {
  id: string
  /** Закрытое меню остаётся в разметке (невидимо и недоступно), чтобы закрываться плавно. */
  open: boolean
  tabs: MenuTab[]
  popular: PopularCardData[]
  onNavigate: () => void
  whatsappHref: string | null
  onPointerEnter: PointerEventHandler
  onPointerLeave: PointerEventHandler
}

/** Задержка смены группы при наведении: мышь, идущая к правой части меню, не переключает группу. */
const HOVER_DELAY = 90

/**
 * Через сколько после открытия волна карточек закончилась: дальше смена группы или раздела —
 * быстрое проявление (правка 02.11.2026: без долгой анимации на каждое наведение).
 */
const SETTLE_MS = 700

/** Ключ вкладки «Популярные решения»: она первая и открыта сразу (решение владельца 16.10.2026). */
const POPULAR = 'popular'

/**
 * Мегаменю каталога. Слева на тёмной чертёжной сетке — «Популярные решения» и группы
 * (программы, оборудование, услуги), внизу предложение подбора; справа — плитки популярных
 * решений или разделы группы и товары раздела под курсором. Показывается одна вкладка за раз,
 * поэтому меню всегда помещается в экран. Открывается шторкой вниз, группы слева проступают
 * по очереди, содержимое вкладки сменяется мягким проявлением, без сдвигов вбок (23.10.2026).
 */
export function MegaMenu({
  id,
  open,
  tabs,
  popular,
  onNavigate,
  whatsappHref,
  onPointerEnter,
  onPointerLeave,
}: Props) {
  const segments = [
    ...(popular.length ? [{ key: POPULAR, label: POPULAR_LABEL }] : []),
    ...tabs.map(({ key, label }) => ({ key, label })),
  ]
  const first = segments[0]?.key ?? ''
  const [active, setActive] = useState(first)
  // Каждое открытие — снова с первой вкладки, как раньше, когда меню собиралось заново.
  const [wasOpen, setWasOpen] = useState(open)
  if (open !== wasOpen) {
    setWasOpen(open)
    if (open) setActive(first)
  }
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined)
  const [settled, setSettled] = useState(false)
  useEffect(() => {
    if (!open) {
      setSettled(false)
      return
    }
    const id = setTimeout(() => setSettled(true), SETTLE_MS)
    return () => clearTimeout(id)
  }, [open])
  useEffect(() => () => clearTimeout(timer.current), [])
  const pick = (key: string, delay = 0) => {
    clearTimeout(timer.current)
    if (delay) timer.current = setTimeout(() => setActive(key), delay)
    else setActive(key)
  }
  const current = segments.find((item) => item.key === active) ?? segments[0]
  if (!current) return null
  const tab = tabs.find((item) => item.key === current.key)
  return (
    <div
      id={id}
      className={styles.menu}
      data-open={open}
      data-settled={settled}
      inert={!open}
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
              onClick={() => pick(item.key)}
              onPointerEnter={(event) =>
                event.pointerType === 'mouse' && pick(item.key, HOVER_DELAY)
              }
              onPointerLeave={() => clearTimeout(timer.current)}
            >
              {item.label}
            </button>
          ))}
        </div>
        <div className={styles.offer}>
          <p className={styles.offerTitle}>Не знаете, что выбрать?</p>
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
