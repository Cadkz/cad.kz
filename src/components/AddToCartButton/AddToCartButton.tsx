'use client'

import { Check, ShoppingCart } from 'lucide-react'
import { useState } from 'react'
import { useCart } from '../CartProvider/CartProvider'
import styles from './AddToCartButton.module.css'

type Props = { offerId: string; productTitle: string; configuration: string }

/** Кнопка-иконка «В корзину» для карточки: добавляет одну конкретную комплектацию. */
export function AddToCartButton({ offerId, productTitle, configuration }: Props) {
  const { add, ready } = useCart()
  const [added, setAdded] = useState(false)
  return (
    <button
      type="button"
      className={styles.button}
      disabled={!ready}
      data-added={added}
      aria-label={
        added
          ? `${productTitle} в корзине`
          : `Добавить в корзину: ${productTitle}, ${configuration}`
      }
      onClick={() => {
        add({ offerId, quantity: 1 })
        setAdded(true)
      }}
    >
      {added ? (
        <Check size={20} strokeWidth={1.75} aria-hidden="true" />
      ) : (
        <ShoppingCart size={20} strokeWidth={1.75} aria-hidden="true" />
      )}
    </button>
  )
}
