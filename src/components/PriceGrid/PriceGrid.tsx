'use client'

import { PriceFilters } from '@/components/PriceFilters/PriceFilters'
import { PriceFolderList } from '@/components/PriceFolderList/PriceFolderList'
import { PriceGridTable } from '@/components/PriceGridTable/PriceGridTable'
import { PricePlaceBar } from '@/components/PricePlaceBar/PricePlaceBar'
import { PriceReview } from '@/components/PriceReview/PriceReview'
import type { PriceGridData } from '@/lib/offerPrices'
import { usePriceGrid } from '@/lib/usePriceGrid'
import styles from './PriceGrid.module.css'

/**
 * Цены: вкладки и папки производителей, как в «Каталоге», внутри папки — товары с комплектациями,
 * цена правится в ячейке. Поиск или фильтр сразу показывают таблицу по всей вкладке. Внизу —
 * полоса с числом правок и сводка.
 */
export function PriceGrid({ data, query }: { data: PriceGridData; query?: string }) {
  const grid = usePriceGrid(data.rows, data.vendors, query)
  return (
    <div className={styles.root}>
      <PricePlaceBar grid={grid} />
      <PriceFilters grid={grid} sections={data.sections} />
      {grid.message && (
        <p className={grid.message.kind === 'ok' ? styles.ok : styles.error} role="status">
          {grid.message.text}
        </p>
      )}
      {grid.showFolders ? <PriceFolderList grid={grid} /> : <PriceGridTable grid={grid} />}
      <PriceReview grid={grid} />
    </div>
  )
}
