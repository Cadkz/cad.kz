'use client'

import { ArrowDown, ArrowUp } from 'lucide-react'
import type { SortState } from '@/lib/useCatalogTree'
import styles from './TreeHeader.module.css'

/**
 * Заголовок колонки дерева «Каталог»: щелчок сортирует по колонке, второй — в обратную сторону.
 */
export function TreeHeader({
  label,
  column,
  sort,
  onSort,
}: {
  label: string
  column: string
  sort: SortState
  onSort: (next: SortState) => void
}) {
  const active = sort.key === column
  const Icon = sort.dir === 'asc' ? ArrowUp : ArrowDown
  return (
    <th aria-sort={active ? (sort.dir === 'asc' ? 'ascending' : 'descending') : undefined}>
      <button
        type="button"
        className={styles.button}
        onClick={() => onSort({ key: column, dir: active && sort.dir === 'asc' ? 'desc' : 'asc' })}
      >
        {label}
        {active && <Icon size={16} strokeWidth={1.75} aria-hidden="true" />}
      </button>
    </th>
  )
}
