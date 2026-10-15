'use client'

import { AdminButton } from '@/components/AdminButton/AdminButton'
import { RateCard } from '@/components/RateCard/RateCard'
import { RatesReview } from '@/components/RatesReview/RatesReview'
import type { RateCard as Card } from '@/lib/ratesRun'
import { useRates } from '@/lib/useRates'
import styles from './RatesForm.module.css'

/** Карточки валют с полями нового курса, под ними — сводка и запись. */
export function RatesForm({ cards }: { cards: Card[] }) {
  const rates = useRates(cards)
  return (
    <div className={styles.root}>
      <div className={styles.cards}>
        {rates.cards.map((card) => (
          <RateCard key={card.currency} card={card} rates={rates} />
        ))}
      </div>
      {rates.error && (
        <p className={styles.error} role="alert">
          {rates.error}
        </p>
      )}
      {rates.done && (
        <p className={styles.ok} role="status">
          {rates.done}
        </p>
      )}
      {rates.preview ? (
        <RatesReview rates={rates} />
      ) : (
        <div className={styles.actions}>
          <AdminButton onClick={rates.check} disabled={!rates.count || rates.busy}>
            {rates.busy ? 'Считаю…' : 'Проверить, как изменятся цены'}
          </AdminButton>
          {!rates.count && (
            <span className={styles.hint}>Впишите новый курс хотя бы одной валюты</span>
          )}
        </div>
      )}
    </div>
  )
}
