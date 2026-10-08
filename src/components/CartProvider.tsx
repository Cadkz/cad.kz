'use client'

import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import Link from 'next/link'
import { normalizeCart } from '@/domain/cart.mjs'

export type CartItem = { offerId: string; quantity: number }
type CartContextValue = {
  items: CartItem[]
  ready: boolean
  add: (item: CartItem) => void
  remove: (offerId: string) => void
  setQuantity: (offerId: string, quantity: number) => void
}
const Context = createContext<CartContextValue | null>(null)
const storageKey = 'cad.kz.demo-cart.v1'

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([])
  const [ready, setReady] = useState(false)
  useEffect(() => {
    try { setItems(normalizeCart(JSON.parse(localStorage.getItem(storageKey) || '[]'))) } catch { setItems([]) }
    setReady(true)
  }, [])
  useEffect(() => {
    if (ready) { try { localStorage.setItem(storageKey, JSON.stringify(items)) } catch { /* Session remains usable if storage is unavailable. */ } }
  }, [items, ready])
  function add(item: CartItem) {
    // Validate synchronously so the configurator can display a useful error.
    const next = normalizeCart([...items, item])
    setItems(next)
  }
  function setQuantity(offerId: string, quantity: number) {
    setItems(normalizeCart(items.map(item => item.offerId === offerId ? { ...item, quantity } : item)))
  }
  return <Context.Provider value={{ items, ready, add, setQuantity, remove: offerId => setItems(items.filter(item => item.offerId !== offerId)) }}>{children}</Context.Provider>
}

export function useCart() {
  const context = useContext(Context)
  if (!context) throw new Error('CartProvider is required')
  return context
}

export function CartLink() {
  const { items } = useCart()
  const quantity = items.reduce((sum, item) => sum + item.quantity, 0)
  return <Link href="/cart" aria-label={`Корзина, ${quantity} товаров`}>Корзина <span className="cart-badge">{quantity}</span></Link>
}
