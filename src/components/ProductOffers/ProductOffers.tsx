'use client'

import { FieldLabel, useDocumentDrawer, useDocumentInfo, useFormFields } from '@payloadcms/ui'
import { Plus } from 'lucide-react'
import { useCallback, useEffect, useState } from 'react'
import { OfferRows } from '@/components/OfferRows/OfferRows'
import type { ProductOfferRow } from '@/lib/productOffers'
import styles from './ProductOffers.module.css'

type State =
  | { status: 'loading' }
  | { status: 'error'; error: string }
  | { status: 'ready'; rows: ProductOfferRow[]; more: boolean }

/**
 * «Комплектации и цены» внутри карточки товара: все предложения товара таблицей. Строка и
 * «+ Комплектация» открывают предложение в выдвижной панели, после сохранения таблица обновляется.
 */
export function ProductOffers() {
  const { id } = useDocumentInfo()
  const title = useFormFields(([fields]) => fields.title?.value)
  const productId = typeof id === 'number' ? id : Number(id)
  const [state, setState] = useState<State>({ status: 'loading' })

  const load = useCallback(async () => {
    if (!productId) return
    try {
      const response = await fetch('/api/admin/product-offers', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ product: productId }),
      })
      const body = (await response.json()) as {
        rows?: ProductOfferRow[]
        more?: boolean
        error?: string
      }
      if (!response.ok || !body.rows)
        setState({ status: 'error', error: body.error ?? 'Не получилось загрузить комплектации.' })
      else setState({ status: 'ready', rows: body.rows, more: Boolean(body.more) })
    } catch {
      setState({ status: 'error', error: 'Нет связи с сервером. Обновите страницу.' })
    }
  }, [productId])

  useEffect(() => {
    void load()
  }, [load])

  const [CreateDrawer, , { openDrawer }] = useDocumentDrawer({ collectionSlug: 'offers' })

  if (!productId)
    return (
      <div className={styles.root}>
        <FieldLabel label="Комплектации и цены" />
        <p className={styles.note}>
          Сохраните товар — после этого здесь можно добавить комплектации.
        </p>
      </div>
    )

  const productTitle = typeof title === 'string' ? title : ''
  return (
    <div className={styles.root}>
      <div className={styles.head}>
        <FieldLabel label="Комплектации и цены" />
        <button type="button" className={styles.add} onClick={openDrawer}>
          <Plus size={16} strokeWidth={1.75} aria-hidden />
          Комплектация
        </button>
      </div>
      <p className={styles.note}>
        Нажмите на строку, чтобы открыть комплектацию. Цена на сайте считается из цены в валюте,
        курса и НДС. Поменять цены сразу у многих товаров —{' '}
        <a href={`/admin/prices?q=${encodeURIComponent(productTitle)}`}>«Цены таблицей»</a>.
      </p>
      {state.status === 'loading' && <p className={styles.note}>Загружаю…</p>}
      {state.status === 'error' && <p className={styles.error}>{state.error}</p>}
      {state.status === 'ready' && <OfferRows rows={state.rows} more={state.more} onSaved={load} />}
      <CreateDrawer
        initialData={{ product: productId, title: productTitle, currency: 'KZT', status: 'draft' }}
        onSave={() => void load()}
      />
    </div>
  )
}
