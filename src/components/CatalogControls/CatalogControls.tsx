'use client'

import { CATALOG_GROUP_LABELS } from '@/domain/catalogNavigation.mjs'
import { catalogSort, SORT_OPTIONS } from '@/domain/catalogSort.mjs'
import type { CatalogGroup } from '@/lib/catalog'
import type { FilterState } from '@/lib/catalogFilter'
import { Chip } from '../Chip/Chip'
import styles from './CatalogControls.module.css'

export function CatalogControls({
  state,
  groups,
  onChange,
  showSort,
}: {
  state: FilterState
  groups: CatalogGroup[]
  onChange: (change: Partial<FilterState>) => void
  showSort: boolean
}) {
  return (
    <div className={styles.root}>
      <nav className={styles.groups} aria-label="Разделы каталога">
        <Chip selected={!state.group} onClick={() => onChange({ group: null })}>
          Весь каталог
        </Chip>
        {groups.map((group) => (
          <Chip key={group} selected={state.group === group} onClick={() => onChange({ group })}>
            {CATALOG_GROUP_LABELS[group]}
          </Chip>
        ))}
      </nav>
      {showSort && (
        <label className={styles.sort}>
          Сортировка
          <select
            value={state.sort ?? 'recommended'}
            onChange={(event) => onChange({ sort: catalogSort(event.target.value) })}
          >
            {SORT_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>
      )}
    </div>
  )
}
