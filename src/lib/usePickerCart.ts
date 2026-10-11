'use client'

import { useState } from 'react'
import { useCart } from '@/components/CartProvider/CartProvider'
import { usePickerContext } from '@/components/PickerProvider/PickerProvider'

/**
 * Корзина на странице товара — общая для итога справа и строки внизу на телефоне.
 * `cartFirst`: у товара есть комплектации с ценой и в выборе нет варианта «по запросу» —
 * тогда главная кнопка «В корзину», а «Получить КП» второй. На семействе корзины нет.
 * `added` сбрасывается, как только выбор или количество меняются: новый выбор ещё не в корзине.
 */
export function usePickerCart() {
  const { lines, quantity, total, view, meta } = usePickerContext()
  const { add, ready } = useCart()
  const key = JSON.stringify([lines.map((line) => line.offer?.id ?? null), quantity])
  const [addedKey, setAddedKey] = useState<string | null>(null)
  const sellable =
    !meta.familySlug &&
    view.steps.some((step) => step.items.some((item) => item.offers.some((o) => o.price)))
  const cartFirst = sellable && total.state !== 'request'
  const canAdd = cartFirst && ready && total.state === 'done' && lines.length > 0

  function addToCart() {
    if (!canAdd) return
    for (const line of lines) if (line.offer) add({ offerId: line.offer.id, quantity })
    setAddedKey(key)
  }

  return { cartFirst, canAdd, added: addedKey === key, addToCart }
}
