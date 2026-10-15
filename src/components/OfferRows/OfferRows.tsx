'use client'

import { useDocumentDrawer } from '@payloadcms/ui'
import { formatAmount, formatDay, formatKzt } from '@/lib/format'
import type { ProductOfferRow } from '@/lib/productOffers'
import styles from './OfferRows.module.css'

const shown = (text: string) => (text && text !== '—' ? text : '')

/** Таблица комплектаций товара; строка открывает комплектацию в выдвижной панели. */
export function OfferRows({
  rows,
  more,
  onSaved,
}: {
  rows: ProductOfferRow[]
  more: boolean
  onSaved: () => Promise<void>
}) {
  if (!rows.length)
    return (
      <p className={styles.empty}>
        Комплектаций пока нет. Без них у товара нет цены и кнопки «В корзину».
      </p>
    )
  return (
    <>
      <div className={styles.scroll}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>Комплектация</th>
              <th>Лицензия</th>
              <th>Цена в валюте</th>
              <th>На сайте</th>
              <th>Статус</th>
              <th>Изменено</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <Row key={row.id} row={row} onSaved={onSaved} />
            ))}
          </tbody>
        </table>
      </div>
      {more && (
        <p className={styles.empty}>
          Показаны первые {rows.length}. Остальные — в списке «Предложения» с фильтром по товару.
        </p>
      )}
    </>
  )
}

function Row({ row, onSaved }: { row: ProductOfferRow; onSaved: () => Promise<void> }) {
  const [Drawer, , { openDrawer }] = useDocumentDrawer({ collectionSlug: 'offers', id: row.id })
  return (
    <tr className={row.published ? undefined : styles.draft}>
      <td>
        <button type="button" className={styles.open} onClick={openDrawer}>
          {shown(row.configuration) || row.title}
        </button>
        <Drawer onSave={() => void onSaved()} onDelete={() => void onSaved()} />
      </td>
      <td>{shown(row.license)}</td>
      <td className={styles.number}>
        {formatAmount(row.amount)} {row.currency}
      </td>
      <td className={styles.number}>
        {row.kzt && row.kzt !== '0' ? (
          formatKzt(row.kzt)
        ) : (
          <span className={styles.warn}>нет цены</span>
        )}
      </td>
      <td>{row.published ? 'На сайте' : 'Черновик'}</td>
      <td>{formatDay(row.updatedAt)}</td>
    </tr>
  )
}
