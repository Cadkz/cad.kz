'use client'

import { ShoppingCart } from 'lucide-react'
import { useCart } from '../CartProvider/CartProvider'
import { HeaderAction } from '../HeaderAction/HeaderAction'
import { useT } from '../LangProvider/LangProvider'
import styles from './CartButton.module.css'

export function CartButton() {
  const t = useT()
  const { items, ready } = useCart()
  const count = items.reduce((sum, item) => sum + item.quantity, 0)
  return (
    <HeaderAction
      href="/cart"
      icon={<ShoppingCart size={20} strokeWidth={1.75} aria-hidden="true" />}
      label={t('Корзина')}
      ariaLabel={count ? t('Корзина, товаров: {count}', { count }) : t('Корзина')}
      badge={
        ready && count > 0 ? (
          <span className={styles.count} aria-hidden="true">
            {count > 99 ? '99+' : count}
          </span>
        ) : null
      }
    />
  )
}
