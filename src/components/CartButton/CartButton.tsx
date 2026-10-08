'use client'

import { ShoppingCart } from 'lucide-react'
import Link from 'next/link'
import { useCart } from '../CartProvider/CartProvider'
import styles from './CartButton.module.css'

export function CartButton() {
  const { items, ready } = useCart()
  const count = items.reduce((sum, item) => sum + item.quantity, 0)
  return (
    <Link
      href="/cart"
      className={styles.button}
      aria-label={count ? `Корзина, товаров: ${count}` : 'Корзина'}
    >
      <ShoppingCart size={20} strokeWidth={1.75} aria-hidden="true" />
      {ready && count > 0 && (
        <span className={styles.count} aria-hidden="true">
          {count > 99 ? '99+' : count}
        </span>
      )}
    </Link>
  )
}
