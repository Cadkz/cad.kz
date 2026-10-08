'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { useCart } from './CartProvider'

type Quote = {
  totalKzt: string
  lines: {
    offerId: string
    productId: string
    title: string
    configuration: string
    quantity: number
    unitKzt: string
    totalKzt: string
  }[]
}
const money = (value: string) => `${new Intl.NumberFormat('ru-KZ').format(BigInt(value))} ₸`

export default function Cart() {
  const { items, ready, remove, setQuantity } = useCart()
  const [quote, setQuote] = useState<Quote | null>(null)
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const [retry, setRetry] = useState(0)
  // biome-ignore lint/correctness/useExhaustiveDependencies: retry намеренно перезапускает пересчёт по кнопке
  useEffect(() => {
    if (!ready) return
    const controller = new AbortController()
    setQuote(null)
    setError('')
    if (!items.length) {
      setBusy(false)
      return
    }
    setBusy(true)
    fetch('/api/cart', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ items }),
      signal: controller.signal,
    })
      .then(async (response) => {
        const data = await response.json()
        if (!response.ok) throw new Error(data.error || 'Не удалось пересчитать корзину')
        if (!controller.signal.aborted) setQuote(data)
      })
      .catch((error) => {
        if (!controller.signal.aborted)
          setError(error instanceof Error ? error.message : 'Ошибка соединения')
      })
      .finally(() => {
        if (!controller.signal.aborted) setBusy(false)
      })
    return () => controller.abort()
  }, [items, ready, retry])

  if (!ready) return <p role="status">Загружаем корзину…</p>
  if (!items.length)
    return (
      <div className="empty-cart">
        <h2>В корзине пока пусто</h2>
        <p>Выберите решение и подходящую комплектацию в каталоге.</p>
        <Link className="button" href="/#catalog">
          Перейти в каталог →
        </Link>
      </div>
    )
  return (
    <div className="cart-layout">
      <div>
        <p>Разные комплектации одного товара сохраняются отдельными строками.</p>
        {items.map((item) => {
          const line = quote?.lines.find((line) => line.offerId === item.offerId)
          return (
            <article className="cart-line" key={item.offerId}>
              <div>
                <h3>
                  {line ? (
                    <Link href={`/products/${line.productId}`}>{line.title}</Link>
                  ) : (
                    item.offerId
                  )}
                </h3>
                <p>{line?.configuration || 'Загружаем комплектацию'}</p>
                <small>{line ? `${money(line.unitKzt)} за единицу` : 'Цена уточняется'}</small>
              </div>
              <label>
                Количество
                <input
                  type="number"
                  min="1"
                  max="999"
                  value={item.quantity}
                  onChange={(event) => {
                    const quantity = Number(event.target.value)
                    if (Number.isInteger(quantity) && quantity >= 1 && quantity <= 999)
                      setQuantity(item.offerId, quantity)
                  }}
                />
              </label>
              <div>
                <strong>{!busy && line ? money(line.totalKzt) : '—'}</strong>
                <button type="button" className="text-button" onClick={() => remove(item.offerId)}>
                  Удалить
                </button>
              </div>
            </article>
          )
        })}
        {error && (
          <div role="alert">
            <p>{error}</p>
            <button type="button" className="secondary" onClick={() => setRetry(retry + 1)}>
              Повторить расчёт
            </button>
          </div>
        )}
      </div>
      <aside className="cart-summary">
        <h2>Ваш комплект</h2>
        <p role="status">
          {busy ? 'Пересчитываем цену…' : quote ? money(quote.totalKzt) : 'Расчёт недоступен'}
        </p>
        <small>Учебные цены, включая НДС 16%. Это демонстрационная корзина.</small>
        <hr />
        <p>
          Оформление подключим после настройки сохранения заказов. Сейчас данные не передаются
          менеджерам.
        </p>
        <Link href="/#catalog">Продолжить подбор →</Link>
      </aside>
    </div>
  )
}
