'use client'

import { Undo2 } from 'lucide-react'
import { Fragment } from 'react'
import { formatAmount, formatKzt } from '@/lib/format'
import type { PriceGridRow } from '@/lib/offerPrices'
import type { PriceGridState } from '@/lib/usePriceGrid'
import styles from './PriceGridTable.module.css'

const CURRENCIES = ['KZT', 'USD', 'EUR', 'RUB'] as const
const kzt = (value: string | null | undefined) => (value ? formatKzt(value) : '—')

/**
 * Таблица цен: товар строкой-заголовком, под ним его комплектации. Цена и валюта правятся прямо
 * в ячейке, справа — цена на сайте после правки.
 */
export function PriceGridTable({ grid }: { grid: PriceGridState }) {
  if (!grid.visible.length)
    return <p className={styles.empty}>Под фильтры не подошло ни одного предложения.</p>
  return (
    <>
      <div className={styles.scroll}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>Комплектация</th>
              <th>Цена в валюте</th>
              <th>НДС в цене</th>
              <th>На сайте сейчас</th>
              <th>Станет</th>
              <th aria-label="Отменить правку" />
            </tr>
          </thead>
          <tbody>
            {grid.shown.map((row, index) => (
              <Fragment key={row.id}>
                {grid.shown[index - 1]?.productId !== row.productId && (
                  <ProductRow row={row} grid={grid} />
                )}
                <Row row={row} grid={grid} />
              </Fragment>
            ))}
          </tbody>
        </table>
      </div>
      {grid.shown.length < grid.visible.length && (
        <button type="button" className={styles.more} onClick={grid.showMore}>
          Показать ещё ({grid.visible.length - grid.shown.length})
        </button>
      )}
    </>
  )
}

/** Товар над своими комплектациями; вне папки производителя — с названием производителя. */
function ProductRow({ row, grid }: { row: PriceGridRow; grid: PriceGridState }) {
  const vendor = grid.filter.vendor === null ? grid.folderTitle(row.vendor ?? 'none') : ''
  return (
    <tr className={styles.product}>
      <td colSpan={6}>
        <a className={styles.productName} href={`/admin/collections/products/${row.productId}`}>
          {row.product}
        </a>
        {vendor && <span className={styles.vendor}>{vendor}</span>}
      </td>
    </tr>
  )
}

function Row({ row, grid }: { row: PriceGridRow; grid: PriceGridState }) {
  const draft = grid.draftOf(row)
  const edited = grid.isEdited(row)
  const invalid = grid.isInvalid(row)
  const big = grid.quoteOf(row)?.change?.big
  const rowClass = [edited && styles.edited, big && styles.big].filter(Boolean).join(' ')
  return (
    <tr className={rowClass || undefined}>
      <td>
        <a
          className={styles.name}
          href={`/admin/collections/offers/${row.id}`}
          aria-label={`Комплектация: ${row.label}`}
        >
          {row.details || 'Основная'}
        </a>
        <span className={styles.muted}>
          {[`ID ${row.id}`, !row.published && 'не на сайте'].filter(Boolean).join(' · ')}
        </span>
      </td>
      <td>
        <span className={styles.price}>
          <input
            className={invalid ? `${styles.amount} ${styles.invalid}` : styles.amount}
            inputMode="decimal"
            aria-label={`Цена: ${row.product}`}
            aria-invalid={invalid || undefined}
            value={draft.text}
            onChange={(event) => grid.setAmount(row, event.target.value)}
          />
          <select
            className={styles.currency}
            aria-label={`Валюта: ${row.product}`}
            value={draft.currency}
            onChange={(event) =>
              grid.setCurrency(row, event.target.value as PriceGridRow['currency'])
            }
          >
            {CURRENCIES.map((currency) => (
              <option key={currency}>{currency}</option>
            ))}
          </select>
        </span>
        {invalid && <span className={styles.warn}>Только цифры, дробь через запятую</span>}
        {edited && !invalid && (
          <span className={styles.muted}>
            было {formatAmount(row.amount)} {row.currency}
          </span>
        )}
      </td>
      <td className={styles.mutedCell}>
        {row.includesVat ? `с НДС ${row.sourceVat} %` : 'без НДС'}
      </td>
      <td>{kzt(row.kzt)}</td>
      <td>
        <NewPrice row={row} grid={grid} />
      </td>
      <td>
        {edited && (
          <button
            type="button"
            className={styles.undo}
            title="Вернуть как было"
            aria-label={`Вернуть цену: ${row.product}`}
            onClick={() => grid.undo(row)}
          >
            <Undo2 size={16} strokeWidth={1.75} aria-hidden />
          </button>
        )}
      </td>
    </tr>
  )
}

/** «Станет»: цена на сайте после правки и насколько изменилась — считает сервер. */
function NewPrice({ row, grid }: { row: PriceGridRow; grid: PriceGridState }) {
  if (!grid.isEdited(row) || grid.isInvalid(row)) return <span className={styles.muted}>—</span>
  const quote = grid.quoteOf(row)
  const change = quote?.change
  return (
    <>
      {quote ? kzt(quote.newKzt) : '…'}
      {quote?.noRate && <span className={styles.warn}>нет курса валюты</span>}
      {change && <span className={change.big ? styles.warn : styles.muted}>{change.text}</span>}
    </>
  )
}
