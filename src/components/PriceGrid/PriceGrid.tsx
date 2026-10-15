'use client'

import { PriceFilters } from '@/components/PriceFilters/PriceFilters'
import { PriceGridTable } from '@/components/PriceGridTable/PriceGridTable'
import { PriceReview } from '@/components/PriceReview/PriceReview'
import type { PriceGridData } from '@/lib/offerPrices'
import { usePriceGrid } from '@/lib/usePriceGrid'
import styles from './PriceGrid.module.css'

/** Таблица цен: фильтры сверху, правка в ячейках, внизу полоса с числом правок и сводка. */
export function PriceGrid({ data }: { data: PriceGridData }) {
  const grid = usePriceGrid(data.rows)
  return (
    <div className={styles.root}>
      <PriceFilters grid={grid} vendors={data.vendors} sections={data.sections} />
      {grid.message && (
        <p className={grid.message.kind === 'ok' ? styles.ok : styles.error} role="status">
          {grid.message.text}
        </p>
      )}
      <PriceGridTable grid={grid} />
      <PriceReview grid={grid} />
    </div>
  )
}
