'use client'

import { AdminButton } from '@/components/AdminButton/AdminButton'
import { BIG_CHANGE_PERCENT } from '@/domain/priceEdit.mjs'
import { formatAmount, formatDay, formatKzt } from '@/lib/format'
import type { RatesState } from '@/lib/useRates'
import styles from './RatesReview.module.css'

const kzt = (value: string | null) => (value ? formatKzt(value) : '—')

/** Сводка перед записью курсов: было → станет, с какого дня, сколько цен и примеры. */
export function RatesReview({ rates }: { rates: RatesState }) {
  const rows = rates.preview ?? []
  return (
    <section className={styles.root} aria-label="Сводка изменений">
      <h2 className={styles.title}>Проверьте перед записью</h2>
      {rows.map((row) => (
        <div
          key={row.currency}
          className={row.change?.big ? `${styles.row} ${styles.big}` : styles.row}
        >
          <p className={styles.line}>
            <strong>
              {row.currency}: {row.from ? `${formatAmount(row.from)} ₸ → ` : ''}
              {formatAmount(row.to)} ₸
            </strong>{' '}
            {row.change ? `(${row.change.text})` : row.from ? '(тот же курс)' : '(первый курс)'} —{' '}
            {row.now ? 'сразу после записи' : `с ${formatDay(`${row.day}T00:00:00+05:00`)}`}
          </p>
          <p className={styles.muted}>
            Пересчитается цен: {row.offers}, из них на сайте {row.published}.
          </p>
          {row.examples.length > 0 && (
            <ul className={styles.list}>
              {row.examples.map((example, index) => (
                // biome-ignore lint/suspicious/noArrayIndexKey: у примеров может совпасть название, порядок не меняется
                <li key={index}>
                  {example.label}: {kzt(example.oldKzt)} → {kzt(example.newKzt)}
                </li>
              ))}
            </ul>
          )}
        </div>
      ))}
      {rates.big && (
        <label className={styles.confirm}>
          <input
            type="checkbox"
            checked={rates.confirmBig}
            onChange={(event) => rates.setConfirmBig(event.target.checked)}
          />
          Курс меняется больше чем на {BIG_CHANGE_PERCENT} % — проверил(а), это не опечатка
        </label>
      )}
      <div className={styles.actions}>
        <AdminButton secondary onClick={rates.back} disabled={rates.busy}>
          Исправить
        </AdminButton>
        <AdminButton
          onClick={rates.apply}
          disabled={rates.busy || (rates.big && !rates.confirmBig)}
        >
          {rates.busy ? 'Записываю…' : 'Записать курсы'}
        </AdminButton>
      </div>
    </section>
  )
}
