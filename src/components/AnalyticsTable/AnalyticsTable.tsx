import type { ReactNode } from 'react'
import styles from './AnalyticsTable.module.css'

type Props = {
  id: string
  title: string
  note?: ReactNode
  head: string[]
  rows: ReactNode[][]
  /** Сколько строк всего (в таблице — первые); остальные — в выгрузке. */
  total?: number
  /** Ссылка на выгрузку этой таблицы в Excel (CSV). */
  csv?: string
  empty: string
}

/** Таблица страницы «Аналитика»: заголовок, пояснение, строки и ссылка на выгрузку. */
export function AnalyticsTable({ id, title, note, head, rows, total, csv, empty }: Props) {
  const more = total !== undefined && total > rows.length
  return (
    <section className={styles.section} aria-labelledby={id}>
      <div className={styles.top}>
        <h2 className={styles.heading} id={id}>
          {title}
        </h2>
        {csv && rows.length > 0 && (
          <a className={styles.csv} href={csv} download>
            Скачать для Excel
          </a>
        )}
      </div>
      {note && <p className={styles.note}>{note}</p>}
      {rows.length ? (
        <div className={styles.scroll}>
          <table className={styles.table}>
            <thead>
              <tr>
                {head.map((cell) => (
                  <th key={cell} scope="col">
                    {cell}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((row, r) => (
                // biome-ignore lint/suspicious/noArrayIndexKey: строки отчёта не переставляются
                <tr key={r}>
                  {row.map((cell, c) => (
                    // biome-ignore lint/suspicious/noArrayIndexKey: столбцы постоянные
                    <td key={c}>{cell}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <p className={styles.empty}>{empty}</p>
      )}
      {more && (
        <p className={styles.note}>
          Показаны первые {rows.length} из {total}. Все — в выгрузке для Excel.
        </p>
      )}
    </section>
  )
}
