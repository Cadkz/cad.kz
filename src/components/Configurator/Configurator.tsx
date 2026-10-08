'use client'

import { Minus, Plus } from 'lucide-react'
import Link from 'next/link'
import { useEffect, useState } from 'react'
import { formatKzt } from '@/lib/format'
import type { ProductOffer } from '@/lib/product'
import { Button } from '../Button/Button'
import { useCart } from '../CartProvider/CartProvider'
import styles from './Configurator.module.css'

type Props = { offers: ProductOffer[]; productTitle: string }
type Quote = { state: 'idle' | 'busy' | 'done' | 'error'; text: string }

/**
 * Конфигуратор: комплектация и количество. Итог считает сервер (/api/quote) —
 * клиент передаёт только ID предложения и количество.
 */
export function Configurator({ offers, productTitle }: Props) {
  const [offerId, setOfferId] = useState(offers[0]?.id ?? '')
  const [quantity, setQuantity] = useState(1)
  const [quote, setQuote] = useState<Quote>({ state: 'idle', text: '' })
  const [added, setAdded] = useState(false)
  const { add, ready } = useCart()

  useEffect(() => {
    if (!offerId) return
    const controller = new AbortController()
    setQuote({ state: 'busy', text: 'Считаем…' })
    setAdded(false)
    fetch('/api/quote', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ offerId, quantity }),
      signal: controller.signal,
    })
      .then(async (response) => {
        const data = await response.json()
        if (!response.ok) throw new Error(data.error || 'Не удалось рассчитать цену')
        setQuote({ state: 'done', text: formatKzt(data.totalKzt) })
      })
      .catch((error: unknown) => {
        if (controller.signal.aborted) return
        setQuote({ state: 'error', text: error instanceof Error ? error.message : 'Ошибка сети' })
      })
    return () => controller.abort()
  }, [offerId, quantity])

  if (!offers.length) return <p className={styles.note}>Цена и комплектации — по запросу.</p>

  const setQty = (value: number) => setQuantity(Math.min(999, Math.max(1, value)))

  return (
    <div className={styles.configurator}>
      <fieldset className={styles.options}>
        <legend className={styles.legend}>Комплектация</legend>
        {offers.map((offer) => (
          <label key={offer.id} className={styles.option} data-selected={offer.id === offerId}>
            <input
              type="radio"
              name="offer"
              value={offer.id}
              checked={offer.id === offerId}
              onChange={() => setOfferId(offer.id)}
              className={styles.radio}
            />
            <span className={styles.optionText}>
              <span className={styles.optionTitle}>{offer.configuration}</span>
              <span className={styles.optionLicense}>{offer.license}</span>
            </span>
            <span className={styles.optionPrice}>{offer.price ?? 'по запросу'}</span>
          </label>
        ))}
      </fieldset>
      <div className={styles.row}>
        <span className={styles.legend}>Количество</span>
        <div className={styles.stepper}>
          <button type="button" onClick={() => setQty(quantity - 1)} aria-label="Меньше">
            <Minus size={16} strokeWidth={1.75} aria-hidden="true" />
          </button>
          <input
            type="number"
            min={1}
            max={999}
            value={quantity}
            aria-label="Количество"
            onChange={(event) => setQty(Number(event.target.value) || 1)}
          />
          <button type="button" onClick={() => setQty(quantity + 1)} aria-label="Больше">
            <Plus size={16} strokeWidth={1.75} aria-hidden="true" />
          </button>
        </div>
      </div>
      <div className={styles.total}>
        <span className={styles.legend}>Итого с НДС</span>
        <output className={styles.sum} data-state={quote.state} aria-live="polite">
          {quote.text}
        </output>
      </div>
      <Button
        block
        disabled={!ready || quote.state !== 'done'}
        onClick={() => {
          add({ offerId, quantity })
          setAdded(true)
        }}
      >
        {added ? 'Добавлено в корзину' : 'В корзину'}
      </Button>
      {added && (
        <Link href="/cart" className={styles.cartLink}>
          Перейти в корзину
        </Link>
      )}
      <p className={styles.note}>
        Учебные цены демоверсии. {productTitle}: точную стоимость и сроки подтвердит менеджер.
      </p>
    </div>
  )
}
