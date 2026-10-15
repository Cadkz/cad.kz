'use client'

import { formatAmount, formatDay } from '@/lib/format'
import { plural } from '@/lib/plural'
import type { RateCard as Card } from '@/lib/ratesRun'
import type { RatesState } from '@/lib/useRates'
import styles from './RateCard.module.css'

/** Одна валюта: действующий курс, запланированные и прошлые, поле нового курса. */
export function RateCard({ card, rates }: { card: Card; rates: RatesState }) {
  const input = rates.inputs[card.currency]
  return (
    <section className={styles.root}>
      <h2 className={styles.currency}>{card.currency}</h2>
      {card.current ? (
        <p className={styles.current}>
          <strong>{formatAmount(card.current.value)} ₸</strong>
          <span className={styles.muted}>действует с {formatDay(card.current.date)}</span>
        </p>
      ) : (
        <p className={styles.warn}>Курс не задан — цены в {card.currency} на сайте не считаются</p>
      )}
      <p className={styles.muted}>
        {card.offers
          ? `От него зависят ${card.offers} ${plural(card.offers, 'цена', 'цены', 'цен')}, на сайте ${card.published}`
          : 'Предложений в этой валюте нет'}
      </p>
      {card.planned.map((rate) => (
        <p key={rate.date} className={styles.planned}>
          Запланирован: {formatAmount(rate.value)} ₸ с {formatDay(rate.date)}
        </p>
      ))}
      <div className={styles.fields}>
        <label className={styles.field}>
          <span>Новый курс, ₸</span>
          <input
            className={styles.input}
            inputMode="decimal"
            placeholder={card.current?.value ?? '550'}
            value={input.value}
            onChange={(event) => rates.set(card.currency, { value: event.target.value })}
          />
        </label>
        <label className={styles.field}>
          <span>Действует с</span>
          <input
            type="date"
            min={rates.today}
            value={input.day}
            onChange={(event) => rates.set(card.currency, { day: event.target.value })}
          />
        </label>
      </div>
      {card.history.length > 0 && (
        <details className={styles.history}>
          <summary>Прошлые курсы</summary>
          <ul className={styles.list}>
            {card.history.map((rate) => (
              <li key={rate.date}>
                {formatAmount(rate.value)} ₸ с {formatDay(rate.date)}
              </li>
            ))}
          </ul>
        </details>
      )}
    </section>
  )
}
