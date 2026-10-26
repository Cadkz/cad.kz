'use client'

import { Sparkles } from 'lucide-react'
import type { MouseEvent } from 'react'
import { type FilterState, type facetOptions, toQuery } from '@/lib/catalogFilter'
import { type ShelfTile, tileState } from '@/lib/catalogShelves'
import { FilterChecks } from '../FilterChecks/FilterChecks'
import styles from './CatalogSidebar.module.css'

type Props = {
  state: FilterState
  /** Открытый раздел верхнего уровня: у подраздела («Плоттеры») — его родитель. */
  current: string | null
  shelves: { software: ShelfTile[]; hardware: ShelfTile[]; service: ShelfTile[] }
  options: ReturnType<typeof facetOptions>
  onChange: (change: Partial<FilterState>) => void
  onOpen: (next: FilterState) => void
  onHome: () => void
}

const BLOCKS = [
  { key: 'software', title: 'Программы по задачам' },
  { key: 'hardware', title: 'Оборудование' },
  { key: 'service', title: 'Обучение и услуги' },
] as const

const toggle = (list: string[], value: string) =>
  list.includes(value) ? list.filter((item) => item !== value) : [...list, value]

/** Обычный щелчок открывает без перезагрузки; с Ctrl, Cmd или Shift — как обычная ссылка. */
const plain = (event: MouseEvent) =>
  !(event.metaKey || event.ctrlKey || event.shiftKey || event.button !== 0)

/**
 * Левая колонка каталога (пробная ветка redesign/catalog-v2): все разделы сразу одним деревом —
 * программы по задачам, оборудование, обучение и услуги, — без вкладок и скрытых шагов.
 * «Обучение» отдельно от направлений: это не задача проектирования (замечание владельца
 * 26.10.2026). Ниже — уточнения открытого раздела: задачи и характеристики оборудования.
 */
export function CatalogSidebar({
  state,
  current,
  shelves,
  options,
  onChange,
  onOpen,
  onHome,
}: Props) {
  const home = !state.direction && !state.type
  return (
    <div className={styles.root}>
      <nav aria-label="Разделы каталога">
        <a
          href="/catalog"
          className={styles.item}
          aria-current={home ? 'page' : undefined}
          onClick={(event) => {
            if (!plain(event)) return
            event.preventDefault()
            onHome()
          }}
        >
          <Sparkles size={16} strokeWidth={1.75} aria-hidden="true" />
          Популярные решения
        </a>
        {BLOCKS.map((block) =>
          shelves[block.key].length ? (
            <div key={block.key} className={styles.block}>
              <p className={styles.heading}>{block.title}</p>
              <ul className={styles.list}>
                {shelves[block.key].map((tile) => (
                  <li key={tile.slug}>
                    <a
                      href={`/catalog?${toQuery(tileState(tile))}`}
                      className={styles.item}
                      aria-current={current === tile.slug ? 'page' : undefined}
                      onClick={(event) => {
                        if (!plain(event)) return
                        event.preventDefault()
                        onOpen(tileState(tile))
                      }}
                    >
                      <span className={styles.label}>{tile.title}</span>
                      <span className={styles.count}>{tile.count}</span>
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ) : null,
        )}
      </nav>
      {options.tasks.length > 0 && (
        <FilterChecks
          title="Задачи"
          options={options.tasks}
          selected={state.tasks}
          limit={8}
          onToggle={(value) => onChange({ tasks: toggle(state.tasks, value) })}
        />
      )}
      {options.features.map((group, index) => (
        <FilterChecks
          key={group.key}
          title={group.label}
          options={group.options}
          limit={6}
          collapsible
          defaultOpen={index < 4}
          selected={state.features[group.key] ?? []}
          onToggle={(value) =>
            onChange({
              features: {
                ...state.features,
                [group.key]: toggle(state.features[group.key] ?? [], value),
              },
            })
          }
        />
      ))}
    </div>
  )
}
