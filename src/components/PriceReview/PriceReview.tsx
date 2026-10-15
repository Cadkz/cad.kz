'use client'

import { AdminButton } from '@/components/AdminButton/AdminButton'
import { BIG_CHANGE_PERCENT } from '@/domain/priceEdit.mjs'
import { formatAmount, formatKzt } from '@/lib/format'
import type { PriceGridState } from '@/lib/usePriceGrid'
import styles from './PriceReview.module.css'

const kzt = (value: string | null | undefined) => (value ? formatKzt(value) : '—')

/**
 * Полоса внизу таблицы цен: сколько правок, затем сводка — что подорожает и подешевеет,
 * изменения больше 30 % первыми и с отдельной галочкой — и только потом «Применить».
 */
export function PriceReview({ grid }: { grid: PriceGridState }) {
  const count = grid.edits.length
  if (!count) return null
  const blocked = !grid.ready || grid.saving || (grid.big > 0 && !grid.confirmBig)
  let next = 'Считаю…'
  if (grid.invalid) next = 'Исправьте ошибки'
  else if (grid.ready) next = 'Проверить и применить'

  return (
    <section className={styles.root} aria-label="Сводка изменений">
      {grid.reviewing && <ReviewList grid={grid} />}
      <div className={styles.bar}>
        <span className={styles.count}>
          Изменено цен: {count}
          {grid.big > 0 && (
            <strong className={styles.alert}>
              {' '}
              · больше {BIG_CHANGE_PERCENT} %: {grid.big}
            </strong>
          )}
          {grid.invalid > 0 && (
            <strong className={styles.alert}> · с ошибкой: {grid.invalid}</strong>
          )}
        </span>
        <div className={styles.actions}>
          <AdminButton secondary onClick={grid.undoAll} disabled={grid.saving}>
            Отменить все
          </AdminButton>
          {grid.reviewing && (
            <AdminButton secondary onClick={grid.closeReview} disabled={grid.saving}>
              К таблице
            </AdminButton>
          )}
          {grid.reviewing ? (
            <AdminButton onClick={grid.apply} disabled={blocked}>
              {grid.saving ? 'Записываю…' : `Применить ${count}`}
            </AdminButton>
          ) : (
            <AdminButton onClick={grid.review} disabled={!grid.ready}>
              {next}
            </AdminButton>
          )}
        </div>
      </div>
    </section>
  )
}

/** Сводка: что подорожает и подешевеет, большие изменения первыми и с отдельной галочкой. */
function ReviewList({ grid }: { grid: PriceGridState }) {
  const percent = (edit: (typeof grid.quoted)[number]) => edit.quote?.change?.percent ?? 0
  const sorted = [...grid.quoted].sort((a, b) => Math.abs(percent(b)) - Math.abs(percent(a)))
  const up = grid.quoted.filter((edit) => percent(edit) > 0).length
  const down = grid.quoted.filter((edit) => percent(edit) < 0).length
  const same = grid.quoted.length - up - down
  return (
    <div className={styles.review}>
      <h2 className={styles.title}>Проверьте перед применением</h2>
      <p className={styles.line}>
        Подорожает: {up}, подешевеет: {down}
        {same > 0 && `, цена в тенге не изменится: ${same}`}.
      </p>
      <div className={styles.scroll}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>Товар и комплектация</th>
              <th>Цена в валюте</th>
              <th>На сайте</th>
              <th>Изменение</th>
            </tr>
          </thead>
          <tbody>
            {sorted.map(({ row, amount, currency, quote }) => (
              <tr key={row.id} className={quote?.change?.big ? styles.big : undefined}>
                <td>{row.label}</td>
                <td>
                  {formatAmount(row.amount)} {row.currency} → {formatAmount(amount ?? '')}{' '}
                  {currency}
                </td>
                <td>
                  {kzt(quote?.oldKzt)} → {kzt(quote?.newKzt)}
                </td>
                <td>{quote?.change?.text ?? 'без изменений'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {grid.big > 0 && (
        <label className={styles.confirm}>
          <input
            type="checkbox"
            checked={grid.confirmBig}
            onChange={(event) => grid.setConfirmBig(event.target.checked)}
          />
          Цена изменится больше чем на {BIG_CHANGE_PERCENT} % у {grid.big} — проверил(а), это не
          опечатка
        </label>
      )}
    </div>
  )
}
