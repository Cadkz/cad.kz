'use client'

import { useEffect, useState } from 'react'
import type { CartItem } from '@/components/CartProvider/CartProvider'

export type QuoteLine = {
  offerId: string
  productId: string
  title: string
  configuration: string
  quantity: number
  unitKzt: string
  totalKzt: string
}
export type Quote = { totalKzt: string; lines: QuoteLine[] }

/**
 * Серверный пересчёт корзины. Клиент отправляет только ID комплектаций и количество,
 * цены приходят от сервера и каждый раз считаются заново.
 */
export function useCartQuote(items: CartItem[], ready: boolean) {
  const [quote, setQuote] = useState<Quote | null>(null)
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const [attempt, setAttempt] = useState(0)

  // biome-ignore lint/correctness/useExhaustiveDependencies: attempt намеренно перезапускает пересчёт по кнопке
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
  }, [items, ready, attempt])

  return { quote, setQuote, error, busy, retry: () => setAttempt((value) => value + 1) }
}
