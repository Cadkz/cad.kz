'use client'

import type { Columns } from '@/domain/priceList.mjs'
import styles from './PriceColumns.module.css'

type Props = { rows: string[][]; columns: Columns; onChange: (columns: Columns) => void }

const letter = (index: number) =>
  index < 26
    ? String.fromCharCode(65 + index)
    : `${String.fromCharCode(64 + Math.floor(index / 26))}${String.fromCharCode(65 + (index % 26))}`

/**
 * Какие колонки прайса — название, цена и ID. Угадывается само по заголовкам, здесь можно
 * поправить. Ниже — первые строки таблицы, чтобы было видно, что выбрано.
 */
export function PriceColumns({ rows, columns, onChange }: Props) {
  const width = Math.max(1, ...rows.slice(0, 60).map((row) => row.length))
  const header = columns.headerRow >= 0 ? (rows[columns.headerRow] ?? []) : []
  const options = Array.from({ length: width }, (_, i) => ({
    value: i,
    label: `${letter(i)}${header[i] ? ` — ${header[i].slice(0, 40)}` : ''}`,
  }))
  const select = (label: string, key: 'nameCol' | 'priceCol' | 'idCol', optional = false) => (
    <label className={styles.field}>
      <span>{label}</span>
      <select
        value={columns[key]}
        onChange={(event) => onChange({ ...columns, [key]: Number(event.target.value) })}
      >
        {optional && <option value={-1}>нет</option>}
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </label>
  )
  const sample = rows
    .slice(columns.headerRow + 1)
    .filter((row) => row.some(Boolean))
    .slice(0, 5)
  return (
    <div className={styles.root}>
      <div className={styles.fields}>
        {select('Название', 'nameCol')}
        {select('Цена', 'priceCol')}
        {select('ID предложения', 'idCol', true)}
        <label className={styles.field}>
          <span>Строка заголовков</span>
          <select
            value={columns.headerRow}
            onChange={(event) => onChange({ ...columns, headerRow: Number(event.target.value) })}
          >
            <option value={-1}>нет</option>
            {rows.slice(0, 30).map((row, i) => (
              // biome-ignore lint/suspicious/noArrayIndexKey: строки таблицы не меняются местами
              <option key={i} value={i}>
                {i + 1}: {row.filter(Boolean).join(' | ').slice(0, 60)}
              </option>
            ))}
          </select>
        </label>
      </div>
      <table className={styles.sample}>
        <thead>
          <tr>
            <th>Название</th>
            <th>Цена</th>
          </tr>
        </thead>
        <tbody>
          {sample.map((row, i) => (
            // biome-ignore lint/suspicious/noArrayIndexKey: короткий образец строк файла
            <tr key={i}>
              <td>{row[columns.nameCol]}</td>
              <td>{row[columns.priceCol]}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
