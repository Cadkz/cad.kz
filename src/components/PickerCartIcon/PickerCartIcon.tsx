'use client'

import { Check, ShoppingCart } from 'lucide-react'
import Link from 'next/link'
import { usePickerCart } from '@/lib/usePickerCart'
import styles from './PickerCartIcon.module.css'

/**
 * Маленькая квадратная кнопка «В корзину» рядом с заявкой (решение владельца 27.10.2026):
 * значок корзины понятен и без слов. После добавления — галочка, ведёт в корзину.
 */
export function PickerCartIcon({ title }: { title: string }) {
  const { canAdd, added, addToCart } = usePickerCart()
  if (added)
    return (
      <Link
        href="/cart"
        className={`${styles.icon} ${styles.added}`}
        aria-label="В корзине — оформить"
      >
        <Check size={20} strokeWidth={1.75} aria-hidden="true" />
      </Link>
    )
  return (
    <button
      type="button"
      className={styles.icon}
      disabled={!canAdd}
      onClick={addToCart}
      aria-label={`Добавить в корзину: ${title}`}
      title="Добавить в корзину"
    >
      <ShoppingCart size={20} strokeWidth={1.75} aria-hidden="true" />
    </button>
  )
}
