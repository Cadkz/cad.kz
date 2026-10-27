'use client'

import { Copy, Trash2 } from 'lucide-react'
import Link from 'next/link'
import { useState } from 'react'
import { lineKzt, totalKzt } from '@/lib/format'
import { catalogHref } from '@/lib/navigationHrefs'
import { useCartQuote } from '@/lib/useCartQuote'
import { Button, ButtonLink } from '../Button/Button'
import { useCart } from '../CartProvider/CartProvider'
import { EmptyCart } from '../EmptyCart/EmptyCart'
import styles from './CartView.module.css'

/**
 * Корзина: строки — это комплектации (ID предложения), итог каждый раз пересчитывает сервер.
 * Без подборок: только проверка состава и отправка заказа. Состав можно скопировать текстом —
 * для согласования внутри компании.
 */
export function CartView({
  whatsappHref = null,
  crmLive = false,
}: {
  whatsappHref?: string | null
  /** Заявки уходят в Битрикс24 — без пометки демоверсии. */
  crmLive?: boolean
}) {
  const { items, ready, remove, setQuantity } = useCart()
  const { quote, error, busy, retry } = useCartQuote(items, ready)
  const [copied, setCopied] = useState(false)
  const withRequests = Boolean(quote?.lines.some((line) => line.request))

  async function copy() {
    if (!quote) return
    const rows = quote.lines.map((l) =>
      l.request
        ? `${l.title}: ${l.quantity} шт., ${l.configuration.toLowerCase()}`
        : `${l.title} — ${l.configuration}: ${l.quantity} × ${lineKzt(l.unitKzt)} = ${lineKzt(l.totalKzt)}`,
    )
    const text = [...rows, `Итого с НДС: ${totalKzt(quote.totalKzt, withRequests)}`].join('\n')
    try {
      await navigator.clipboard.writeText(text)
      setCopied(true)
    } catch {
      setCopied(false)
    }
  }

  if (!ready) return <EmptyCart loading whatsappHref={whatsappHref} />
  if (!items.length) return <EmptyCart whatsappHref={whatsappHref} />

  return (
    <>
      <div className={styles.layout}>
        <ul className={styles.lines}>
          {items.map((item) => {
            const line = quote?.lines.find((l) => l.offerId === item.offerId)
            return (
              <li key={item.offerId} className={styles.line}>
                <div className={styles.info}>
                  <h2 className={styles.title}>
                    {line ? <Link href={line.href}>{line.title}</Link> : 'Загружаем…'}
                  </h2>
                  <p className={styles.config}>{line?.configuration}</p>
                  {line && !line.request && (
                    <p className={styles.unit}>{lineKzt(line.unitKzt)} за единицу</p>
                  )}
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
                <p className={styles.sum}>
                  {!busy && line ? (line.request ? 'По запросу' : lineKzt(line.totalKzt)) : '—'}
                </p>
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
            {busy ? 'Пересчитываем…' : quote ? totalKzt(quote.totalKzt, withRequests) : '—'}
          </p>
          {withRequests && (
            <p className={styles.note}>
              Комплектацию и цену позиций по запросу менеджер подберёт и подтвердит после
              оформления.
            </p>
          )}
          {error && (
            <div role="alert" className={styles.error}>
              <p>{error}</p>
              <Button variant="secondary" size="sm" onClick={retry}>
                Повторить расчёт
              </Button>
            </div>
          )}
          <ButtonLink href="/checkout" block>
            Оформить заказ
          </ButtonLink>
          <Button variant="text" size="sm" onClick={copy} disabled={!quote || busy}>
            <Copy size={16} strokeWidth={1.75} aria-hidden="true" />
            {copied ? 'Состав скопирован' : 'Скопировать состав'}
          </Button>
          {crmLive ? null : (
            <p className={styles.note}>
              Демоверсия: заказ сохранится в учебной базе и менеджерам не передаётся.
            </p>
          )}
          <ButtonLink href={catalogHref()} variant="outline" block>
            Продолжить подбор
          </ButtonLink>
        </aside>
      </div>
    </>
  )
}
