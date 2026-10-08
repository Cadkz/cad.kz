'use client'

import { Trash2 } from 'lucide-react'
import Link from 'next/link'
import { useEffect, useState } from 'react'
import { formatKzt } from '@/lib/format'
import { catalogHref, productHref } from '@/lib/navigationHrefs'
import { Button, ButtonLink } from '../Button/Button'
import { useCart } from '../CartProvider/CartProvider'
import styles from './CartView.module.css'

type Line = {
  offerId: string
  productId: string
  title: string
  configuration: string
  unitKzt: string
  totalKzt: string
}
type Quote = { totalKzt: string; lines: Line[] }

/** Корзина: строки — это комплектации (ID предложения), итог каждый раз пересчитывает сервер. */
export function CartView() {
  const { items, ready, remove, setQuantity } = useCart()
  const [quote, setQuote] = useState<Quote | null>(null)
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const [retry, setRetry] = useState(0)

  // biome-ignore lint/correctness/useExhaustiveDependencies: retry намеренно перезапускает пересчёт по кнопке
  useEffect(() => {
    if (!ready || !items.length) return
    const controller = new AbortController()
    setBusy(true)
    setError('')
    fetch('/api/cart', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ items }),
      signal: controller.signal,
    })
      .then(async (response) => {
        const data = await response.json()
        if (!response.ok) throw new Error(data.error || 'Не удалось пересчитать корзину')
        setQuote(data)
      })
      .catch((reason: unknown) => {
        if (!controller.signal.aborted)
          setError(reason instanceof Error ? reason.message : 'Ошибка соединения')
      })
      .finally(() => {
        if (!controller.signal.aborted) setBusy(false)
      })
    return () => controller.abort()
  }, [items, ready, retry])

  if (!ready) return <p role="status">Загружаем корзину…</p>
  if (!items.length)
    return (
      <div className={styles.empty}>
        <h2>В корзине пока пусто</h2>
        <p>Выберите решение и подходящую комплектацию в каталоге.</p>
        <ButtonLink href={catalogHref()}>Перейти в каталог</ButtonLink>
      </div>
    )

  return (
    <div className={styles.layout}>
      <ul className={styles.lines}>
        {items.map((item) => {
          const line = quote?.lines.find((l) => l.offerId === item.offerId)
          return (
            <li key={item.offerId} className={styles.line}>
              <div className={styles.info}>
                <h2 className={styles.title}>
                  {line ? (
                    <Link href={productHref(line.productId)}>{line.title}</Link>
                  ) : (
                    'Загружаем…'
                  )}
                </h2>
                <p className={styles.config}>{line?.configuration}</p>
                {line && <p className={styles.unit}>{formatKzt(line.unitKzt)} за единицу</p>}
              </div>
              <label className={styles.qty}>
                <span className="visually-hidden">Количество</span>
                <input
                  type="number"
                  min={1}
                  max={999}
                  value={item.quantity}
                  onChange={(event) => {
                    const value = Number(event.target.value)
                    if (Number.isInteger(value) && value >= 1 && value <= 999)
                      setQuantity(item.offerId, value)
                  }}
                />
              </label>
              <p className={styles.sum}>{!busy && line ? formatKzt(line.totalKzt) : '—'}</p>
              <button
                type="button"
                className={styles.remove}
                onClick={() => remove(item.offerId)}
                aria-label={`Удалить ${line?.title ?? 'строку'}`}
              >
                <Trash2 size={20} strokeWidth={1.75} aria-hidden="true" />
              </button>
            </li>
          )
        })}
      </ul>
      <aside className={styles.summary} aria-label="Итог">
        <p className={styles.summaryLabel}>Итого с НДС</p>
        <p className={styles.total} role="status">
          {busy ? 'Пересчитываем…' : quote ? formatKzt(quote.totalKzt) : '—'}
        </p>
        {error && (
          <div role="alert" className={styles.error}>
            <p>{error}</p>
            <Button variant="secondary" size="sm" onClick={() => setRetry(retry + 1)}>
              Повторить расчёт
            </Button>
          </div>
        )}
        <p className={styles.note}>
          Демоверсия: оформление заказа ещё не подключено, данные менеджерам не передаются. Разные
          комплектации одного товара хранятся отдельными строками.
        </p>
        <ButtonLink href={catalogHref()} variant="outline" block>
          Продолжить подбор
        </ButtonLink>
      </aside>
    </div>
  )
}
