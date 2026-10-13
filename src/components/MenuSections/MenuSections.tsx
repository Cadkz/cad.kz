'use client'

import { ArrowRight, Star } from 'lucide-react'
import Link from 'next/link'
import { useEffect, useRef, useState } from 'react'
import type { MenuColumn, MenuTab } from '@/lib/navigation'
import { catalogHref } from '@/lib/navigationHrefs'
import type { PopularCardData } from '@/lib/popular'
import { MenuCard } from '../MenuCard/MenuCard'
import { MenuPanel } from '../MenuPanel/MenuPanel'
import { PopularCard } from '../PopularCard/PopularCard'
import { SectionIcon } from '../SectionIcon/SectionIcon'
import styles from './MenuSections.module.css'

type Props = { tab: MenuTab; popular: PopularCardData[]; onNavigate: () => void }

/** Задержка смены раздела при наведении: мышь, идущая по диагонали к программам, не переключает раздел. */
const HOVER_DELAY = 90
const POPULAR = 'popular'

/** Подсказка под программой: производитель и пояснение из названия. */
function hint(program: MenuColumn['programs'][number]) {
  return [program.vendor, program.note].filter(Boolean).join(' · ') || null
}

/**
 * Разделы группы слева (по задачам) и справа — программы раздела под курсором, сразу, без шага
 * с производителями (вариант А, 13.10.2026). У программ первым пунктом «Популярные программы»:
 * открыты, пока не навели на раздел. Раздел — ссылка в каталог: наведение или фокус показывают
 * его программы, клик открывает каталог.
 */
export function MenuSections({ tab, popular, onNavigate }: Props) {
  const [active, setActive] = useState<number | typeof POPULAR>(popular.length ? POPULAR : 0)
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined)
  useEffect(() => () => clearTimeout(timer.current), [])
  const column = active === POPULAR ? null : (tab.columns[active] ?? tab.columns[0])

  const preview = (index: number | typeof POPULAR, delay = 0) => {
    clearTimeout(timer.current)
    if (delay) timer.current = setTimeout(() => setActive(index), delay)
    else setActive(index)
  }
  const hover = (index: number | typeof POPULAR) => ({
    onFocus: () => preview(index),
    onPointerEnter: (event: React.PointerEvent) =>
      event.pointerType === 'mouse' && preview(index, HOVER_DELAY),
    onPointerLeave: () => clearTimeout(timer.current),
  })

  return (
    <div className={styles.root}>
      <ul className={styles.sections}>
        {popular.length > 0 && (
          <li>
            <Link
              href={tab.allHref}
              className={styles.section}
              aria-current={active === POPULAR ? 'true' : undefined}
              onClick={onNavigate}
              {...hover(POPULAR)}
            >
              <span className={styles.icon}>
                <Star size={16} strokeWidth={1.75} aria-hidden="true" />
              </span>
              <span className={styles.sectionTitle}>Популярные программы</span>
            </Link>
          </li>
        )}
        {popular.length > 0 && <li className={styles.caption}>По задачам</li>}
        {tab.columns.map((item, index) => (
          <li key={item.title}>
            <Link
              href={item.allHref}
              className={styles.section}
              aria-current={index === active ? 'true' : undefined}
              onClick={onNavigate}
              {...hover(index)}
            >
              <span className={styles.icon}>
                <SectionIcon name={item.icon} size={16} />
              </span>
              <span className={styles.sectionTitle}>{item.title}</span>
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
      {column ? (
        <MenuPanel
          key={column.title}
          title={column.title}
          links={{ caption: 'Производители:', items: column.vendors }}
          footer={[{ href: column.allHref, label: 'Все программы раздела' }]}
          onNavigate={onNavigate}
        >
          {column.programs.map((program) => (
            <MenuCard
              key={program.href}
              title={program.title}
              hint={hint(program)}
              href={program.href}
              onNavigate={onNavigate}
            />
          ))}
        </MenuPanel>
      ) : (
        <MenuPanel
          title="Популярные программы"
          footer={[{ href: catalogHref({ group: 'software' }), label: 'Все программы' }]}
          onNavigate={onNavigate}
        >
          {popular.map((card) => (
            <li key={card.key}>
              <PopularCard card={card} onNavigate={onNavigate} />
            </li>
          ))}
        </MenuPanel>
      )}
    </div>
  )
}
