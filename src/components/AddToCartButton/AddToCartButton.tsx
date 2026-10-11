'use client'

import { Check, ShoppingCart } from 'lucide-react'
import Link from 'next/link'
import { useState } from 'react'
import { useCart } from '../CartProvider/CartProvider'
import styles from './AddToCartButton.module.css'

type Props = {
  offerId: string
  title: string
  /** block — во всю ширину карточки каталога; icon — квадратная кнопка в строке подборки. */
  look?: 'block' | 'icon'
}

/**
 * «В корзину» для товара с одной комплектацией: кладёт её и сразу превращается в ссылку
 * «В корзине», чтобы было видно, что нажатие сработало. Цену считает сервер в корзине.
 */
export function AddToCartButton({ offerId, title, look = 'block' }: Props) {
  const { items, add, ready } = useCart()
  const [error, setError] = useState(false)
  const inCart = ready && items.some((item) => item.offerId === offerId)
  const cls = look === 'icon' ? `${styles.button} ${styles.icon}` : styles.button

  if (inCart)
    return (
      <Link
        href="/cart"
        className={`${cls} ${styles.done}`}
        aria-label={look === 'icon' ? `${title} в корзине, перейти в корзину` : undefined}
      >
        <Check size={16} strokeWidth={1.75} aria-hidden="true" />
        {look === 'block' && 'В корзине'}
      </Link>
    )
  return (
    <button
      type="button"
      className={cls}
      disabled={!ready}
      aria-label={look === 'icon' ? `Добавить в корзину: ${title}` : undefined}
      title={error ? 'Корзина заполнена — оформите заказ или удалите лишнее' : undefined}
      onClick={() => {
        try {
          add({ offerId, quantity: 1 })
        } catch {
          setError(true)
        }
      }}
    >
      <ShoppingCart size={16} strokeWidth={1.75} aria-hidden="true" />
      {look === 'block' && 'В корзину'}
    </button>
  )
}
