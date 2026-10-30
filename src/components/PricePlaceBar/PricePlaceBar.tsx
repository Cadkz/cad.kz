'use client'

import { ChevronRight } from 'lucide-react'
import { TREE_GROUPS } from '@/domain/adminCatalog.mjs'
import type { PriceGridState } from '@/lib/usePriceGrid'
import styles from './PricePlaceBar.module.css'

/**
 * Над «Ценами»: вкладки как в «Каталоге» (ПО / оборудование / услуги и обучение), путь
 * «вкладка → производитель» и подсказка, если поиск нашёл что-то в других вкладках.
 */
export function PricePlaceBar({ grid }: { grid: PriceGridState }) {
  const { group, vendor } = grid.filter
  const groupLabel = TREE_GROUPS.find((item) => item.value === group)?.label ?? ''
  const other = TREE_GROUPS.filter((item) => (grid.elsewhere[item.value] ?? 0) > 0)
  return (
    <div className={styles.root}>
      <div className={styles.tabs} role="tablist" aria-label="Раздел цен">
        {TREE_GROUPS.map((item) => (
          <button
            key={item.value}
            type="button"
            role="tab"
            aria-selected={group === item.value}
            className={styles.tab}
            onClick={() => grid.go({ group: item.value, vendor: null })}
          >
            {item.label}
          </button>
        ))}
      </div>
      <nav className={styles.path} aria-label="Путь по ценам">
        {vendor === null ? (
          <span>{groupLabel}</span>
        ) : (
          <>
            <button
              type="button"
              className={styles.crumb}
              onClick={() => grid.go({ group, vendor: null })}
            >
              {groupLabel}
            </button>
            <ChevronRight size={16} strokeWidth={1.75} aria-hidden="true" />
            <span>{grid.folderTitle(vendor)}</span>
          </>
        )}
      </nav>
      {other.length > 0 && (
        <p className={styles.hint}>
          Ещё нашлось:{' '}
          {other.map((item, index) => (
            <span key={item.value}>
              {index > 0 && ', '}
              <button
                type="button"
                className={styles.crumb}
                onClick={() => grid.go({ group: item.value, vendor: null })}
              >
                {item.label} — {grid.elsewhere[item.value]}
              </button>
            </span>
          ))}
        </p>
      )}
    </div>
  )
}
