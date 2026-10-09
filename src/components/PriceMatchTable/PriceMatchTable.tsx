'use client'

import { useState } from 'react'
import type { MatchRow, Preview } from '@/lib/usePriceList'
import styles from './PriceMatchTable.module.css'

type Props = {
  preview: Preview
  onToggle: (index: number, use: boolean) => void
  onPick: (index: number, offerId: number | null) => void
}

const STATUS: Record<MatchRow['status'], string> = {
  id: 'по ID',
  saved: 'запомнено',
  auto: 'найдено',
  check: 'проверьте',
  none: 'не найдено',
  noPrice: 'нет цены',
  manual: 'выбрано вручную',
}

const attention = (row: MatchRow) => ['check', 'none'].includes(row.status)

/** Сколько процентов изменилась цена в тенге: «+12%», «−3%». */
function change(row: MatchRow) {
  const from = Number(row.oldKzt?.replace(/\D/g, ''))
  const to = Number(row.newKzt?.replace(/\D/g, ''))
  if (!from || !to || from === to) return null
  const percent = Math.round(((to - from) / from) * 100)
  return { text: `${percent > 0 ? '+' : '−'}${Math.abs(percent)}%`, big: Math.abs(percent) >= 30 }
}

/**
 * Итог проверки прайса: строка файла → предложение на сайте, цена сейчас и после загрузки.
 * Галочка — записывать строку. Неуверенные совпадения не отмечены: выберите предложение сами.
 */
export function PriceMatchTable({ preview, onToggle, onPick }: Props) {
  const [onlyAttention, setOnlyAttention] = useState(false)
  const visible = preview.rows.filter(
    (row) => row.status !== 'noPrice' && (!onlyAttention || attention(row)),
  )
  const count = (test: (row: MatchRow) => boolean) => preview.rows.filter(test).length
  return (
    <div className={styles.root}>
      <p className={styles.summary}>
        Строк с ценой: {count((r) => r.status !== 'noPrice')}. Найдено точно:{' '}
        {count((r) => ['id', 'saved', 'auto'].includes(r.status))}, проверить:{' '}
        {count((r) => r.status === 'check')}, не найдено: {count((r) => r.status === 'none')}.
        Отмечено к записи: {count((r) => r.use)}.
      </p>
      <label className={styles.filter}>
        <input
          type="checkbox"
          checked={onlyAttention}
          onChange={(event) => setOnlyAttention(event.target.checked)}
        />
        Показать только строки, которые нужно проверить
      </label>
      <div className={styles.scroll}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th aria-label="Записать" />
              <th>В прайсе</th>
              <th>Предложение на сайте</th>
              <th>Сейчас</th>
              <th>Станет</th>
            </tr>
          </thead>
          <tbody>
            {visible.map((row) => {
              const delta = change(row)
              return (
                <tr key={row.index} className={attention(row) ? styles.warn : undefined}>
                  <td>
                    <input
                      type="checkbox"
                      aria-label={`Записать «${row.name}»`}
                      checked={row.use}
                      disabled={row.offerId === null}
                      onChange={(event) => onToggle(row.index, event.target.checked)}
                    />
                  </td>
                  <td>
                    <span className={styles.name}>{row.name}</span>
                    <span className={styles.muted}>
                      {row.price} · {STATUS[row.status]}
                    </span>
                  </td>
                  <td>
                    <select
                      className={styles.offer}
                      value={row.offerId ?? ''}
                      onChange={(event) =>
                        onPick(row.index, event.target.value ? Number(event.target.value) : null)
                      }
                    >
                      <option value="">— не записывать —</option>
                      {preview.offers.map((offer) => (
                        <option key={offer.id} value={offer.id}>
                          {offer.label}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td>
                    {row.oldKzt ?? '—'}
                    {row.oldAmount && <span className={styles.muted}>{row.oldAmount}</span>}
                  </td>
                  <td>
                    {row.newKzt ?? '—'}
                    {delta && (
                      <span className={delta.big ? styles.big : styles.muted}>{delta.text}</span>
                    )}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}
