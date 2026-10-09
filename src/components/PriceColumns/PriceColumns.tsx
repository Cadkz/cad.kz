'use client'

import { type Columns, columnLetter as letter, type PriceSet } from '@/domain/priceList.mjs'
import styles from './PriceColumns.module.css'

type Props = {
  rows: string[][]
  columns: Columns
  sets: PriceSet[]
  onChange: (columns: Columns) => void
  onChooseSet: (index: number) => void
}

/**
 * Какие колонки прайса — название, группа, цена и ID. Угадывается само по заголовкам, здесь можно
 * поправить. Если в строке несколько цен (S392 и S Pro) и есть такие же цены в другой валюте —
 * выбор набора цен. Ниже — первые строки таблицы, чтобы было видно, что выбрано.
 */
export function PriceColumns({ rows, columns, sets, onChange, onChooseSet }: Props) {
  const width = Math.max(1, ...rows.slice(0, 60).map((row) => row.length))
  const header = columns.headerRow >= 0 ? (rows[columns.headerRow] ?? []) : []
  const options = Array.from({ length: width }, (_, i) => ({
    value: i,
    label: `${letter(i)}${header[i] ? ` — ${header[i].slice(0, 40)}` : ''}`,
  }))
  const select = (
    label: string,
    key: 'nameCol' | 'priceCol' | 'idCol' | 'groupCol',
    optional = false,
  ) => (
    <label className={styles.field}>
      <span>{label}</span>
      <select
        value={columns[key] ?? -1}
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
  const multi = (columns.prices?.length ?? 0) > 1
  const active = sets.findIndex((set) => set.prices[0]?.col === columns.prices?.[0]?.col)
  const priceCols = multi ? (columns.prices ?? []) : [{ col: columns.priceCol, label: 'Цена' }]
  const sample = rows
    .slice(columns.headerRow + 1)
    .filter((row) => row.some(Boolean))
    .slice(0, 5)
  return (
    <div className={styles.root}>
      <div className={styles.fields}>
        {select('Название', 'nameCol')}
        {select('Группа (слева от названия)', 'groupCol', true)}
        {!multi && select('Цена', 'priceCol')}
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
      {sets.length > 1 && (
        <fieldset className={styles.sets}>
          <legend>Какие цены брать (в строке по цене на каждую колонку)</legend>
          {sets.map((set, index) => (
            <label key={set.title} className={styles.set}>
              <input
                type="radio"
                name="price-set"
                checked={index === active}
                onChange={() => onChooseSet(index)}
              />
              {set.title}
            </label>
          ))}
        </fieldset>
      )}
      <table className={styles.sample}>
        <thead>
          <tr>
            {(columns.groupCol ?? -1) >= 0 && <th>Группа</th>}
            <th>Название</th>
            {priceCols.map((price) => (
              <th key={price.col}>{price.label}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {sample.map((row, i) => (
            // biome-ignore lint/suspicious/noArrayIndexKey: короткий образец строк файла
            <tr key={i}>
              {(columns.groupCol ?? -1) >= 0 && <td>{row[columns.groupCol ?? 0]}</td>}
              <td>{row[columns.nameCol]}</td>
              {priceCols.map((price) => (
                <td key={price.col}>{row[price.col]}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
