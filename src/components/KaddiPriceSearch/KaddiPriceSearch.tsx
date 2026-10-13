'use client'

import { type FormEvent, useState } from 'react'
import { AdminButton } from '@/components/AdminButton/AdminButton'
import styles from './KaddiPriceSearch.module.css'

type Row = {
  code: string
  name: string
  purchase: string
  term: string
  unit: string
  price: string | null
  note?: string
  delivery: string
}

type Result = { total: number; rows: Row[]; note?: string; error?: string }

/**
 * Проверка прайса глазами: тот же поиск, что у Кадди, и что Кадди скажет по каждой строке —
 * цену или почему передаст менеджеру, и срок поставки по правилам.
 */
export function KaddiPriceSearch() {
  const [query, setQuery] = useState('')
  const [purchase, setPurchase] = useState('')
  const [busy, setBusy] = useState(false)
  const [result, setResult] = useState<Result | null>(null)

  async function search(event: FormEvent) {
    event.preventDefault()
    if (query.trim().length < 2) return
    setBusy(true)
    try {
      const response = await fetch('/api/admin/kaddi-data', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'search', query, purchase }),
      })
      setResult(await response.json())
    } catch {
      setResult({ total: 0, rows: [], error: 'Нет связи с сервером' })
    } finally {
      setBusy(false)
    }
  }

  return (
    <section className={styles.root}>
      <h2 className={styles.title}>Проверить прайс, как его видит Кадди</h2>
      <form className={styles.form} onSubmit={search}>
        <label className={styles.field}>
          <span>Название, артикул или код</span>
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="автокад, АВС ПИР, C1RK1-WW1762-L158"
          />
        </label>
        <label className={styles.field}>
          <span>Тип покупки</span>
          <select value={purchase} onChange={(e) => setPurchase(e.target.value)}>
            <option value="">любой</option>
            <option value="новая">новая лицензия</option>
            <option value="продление">продление</option>
            <option value="обновление">обновление / переход</option>
          </select>
        </label>
        <AdminButton type="submit" disabled={busy}>
          {busy ? 'Ищем…' : 'Найти'}
        </AdminButton>
      </form>
      {result?.error && <p className={styles.error}>{result.error}</p>}
      {result && !result.error && (
        <>
          <p className={styles.hint}>
            Нашлось: {result.total}
            {result.total > result.rows.length ? `, показаны первые ${result.rows.length}` : ''}.
            {result.note ? ` ${result.note}` : ''}
          </p>
          {result.rows.length > 0 && (
            <div className={styles.scroll}>
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th>Код</th>
                    <th>Название</th>
                    <th>Покупка, срок</th>
                    <th>Что скажет Кадди</th>
                    <th>Поставка</th>
                  </tr>
                </thead>
                <tbody>
                  {result.rows.map((row) => (
                    <tr key={row.code}>
                      <td>{row.code}</td>
                      <td>{row.name}</td>
                      <td>
                        {row.purchase}, {row.term}
                      </td>
                      <td>{row.price ? `${row.price} ${row.unit}` : row.note}</td>
                      <td>{row.delivery}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}
    </section>
  )
}
