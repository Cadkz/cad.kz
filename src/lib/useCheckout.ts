'use client'

import { useEffect, useRef, useState } from 'react'
import { useCart } from '@/components/CartProvider/CartProvider'
import type { DoneOrder } from '@/components/CheckoutDone/CheckoutDone'
import type { FormValues } from '@/components/CheckoutForm/CheckoutForm'
import { formatKzt } from './format'
import type { Quote } from './useCartQuote'

const keyStorage = 'cad.kz.checkout-key.v1'
const lastOrderStorage = 'cad.kz.last-order.v1'
const fieldNames = ['name', 'phone', 'email', 'type', 'companyName', 'bin', 'comment', 'consent']

type Reply = {
  status?: string
  error?: string
  errors?: Record<string, string>
  quote?: Quote
  order?: DoneOrder
}

function read(key: string) {
  try {
    return sessionStorage.getItem(key)
  } catch {
    return null
  }
}

function write(key: string, value: string | null) {
  try {
    if (value === null) sessionStorage.removeItem(key)
    else sessionStorage.setItem(key, value)
  } catch {
    /* Без хранилища форма работает, просто ключ повтора живёт до перезагрузки страницы. */
  }
}

function savedOrder(): DoneOrder | null {
  try {
    return JSON.parse(read(lastOrderStorage) ?? 'null')
  } catch {
    return null
  }
}

/**
 * Отправка заказа. Ключ повтора живёт, пока заявка не сохранена: если связь оборвалась или покупатель
 * нажал дважды, повторная отправка вернёт ту же заявку, а не создаст вторую.
 */
export function useCheckout(quote: Quote | null, setQuote: (quote: Quote) => void) {
  const { items, ready, clear } = useCart()
  const key = useRef<string | null>(null)
  const [sending, setSending] = useState(false)
  const [done, setDone] = useState<DoneOrder | null>(null)
  const [serverErrors, setServerErrors] = useState<Record<string, string>>({})
  const [formError, setFormError] = useState('')
  const [priceNotice, setPriceNotice] = useState('')

  // После успешной отправки корзина пуста: при перезагрузке показываем результат, а не пустую корзину.
  useEffect(() => {
    if (ready && !items.length) setDone(savedOrder())
  }, [ready, items.length])

  function resetKey() {
    write(keyStorage, null)
    key.current = null
  }

  function finish(order: DoneOrder) {
    resetKey()
    write(lastOrderStorage, JSON.stringify(order))
    setDone(order)
    clear()
  }

  function showInvalid(errors: Record<string, string>) {
    const entries = Object.entries(errors)
    setServerErrors(Object.fromEntries(entries.filter(([name]) => fieldNames.includes(name))))
    setFormError(
      entries
        .filter(([name]) => !fieldNames.includes(name))
        .map(([, message]) => message)
        .join(' '),
    )
  }

  function handle(reply: Reply) {
    if ((reply.status === 'created' || reply.status === 'repeated') && reply.order)
      return finish(reply.order)
    if (reply.status === 'price_changed' && reply.quote && quote) {
      setPriceNotice(
        `Цена изменилась: было ${formatKzt(quote.totalKzt)}, стало ${formatKzt(reply.quote.totalKzt)}. Проверьте сумму и подтвердите заказ ещё раз.`,
      )
      return setQuote(reply.quote)
    }
    if (reply.status === 'invalid' && reply.errors) return showInvalid(reply.errors)
    // Ключ с другими данными больше не подходит: следующая отправка — это новый заказ.
    if (reply.status === 'key_conflict') resetKey()
    setFormError(reply.error ?? 'Не удалось отправить заявку. Повторите отправку.')
  }

  async function submit(values: FormValues) {
    if (!quote) return
    key.current ??= read(keyStorage) ?? crypto.randomUUID()
    write(keyStorage, key.current)
    setSending(true)
    setFormError('')
    setPriceNotice('')
    setServerErrors({})
    try {
      const response = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          idempotencyKey: key.current,
          items,
          expectedTotalKzt: quote.totalKzt,
          ...values,
        }),
      })
      handle(await response.json().catch(() => ({})))
    } catch {
      setFormError('Не удалось отправить заявку. Проверьте соединение и повторите: дубля не будет.')
    } finally {
      setSending(false)
    }
  }

  return { submit, sending, done, serverErrors, formError, priceNotice }
}
