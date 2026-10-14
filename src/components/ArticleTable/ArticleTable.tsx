import { InlineText } from '../InlineText/InlineText'
import styles from './ArticleTable.module.css'

type Props = { head: string[] | null; rows: string[][] }

/** Ключи строк и ячеек: в таблицах старого сайта бывают одинаковые строки. */
const keyed = <T,>(items: T[], name: (item: T) => string) => {
  const seen = new Map<string, number>()
  return items.map((item): [string, T] => {
    const base = name(item)
    const count = (seen.get(base) ?? 0) + 1
    seen.set(base, count)
    return [`${base}#${count}`, item]
  })
}

/**
 * Таблица в тексте статьи (характеристики, сравнение комплектаций). Широкая таблица
 * прокручивается вбок внутри своей рамки, страница вбок не едет.
 */
export function ArticleTable({ head, rows }: Props) {
  return (
    // biome-ignore lint/a11y/noNoninteractiveTabindex: рамку широкой таблицы прокручивают с клавиатуры
    <section className={styles.frame} tabIndex={0} aria-label="Таблица">
      <table className={styles.table}>
        {head && (
          <thead>
            <tr>
              {keyed(head, String).map(([key, cell]) => (
                <th key={key} scope="col" className={styles.head}>
                  <InlineText text={cell} />
                </th>
              ))}
            </tr>
          </thead>
        )}
        <tbody>
          {keyed(rows, (row) => row.join('|')).map(([rowKey, row]) => (
            <tr key={rowKey}>
              {keyed(row, String).map(([key, cell]) => (
                <td key={key} className={styles.cell}>
                  <InlineText text={cell} />
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  )
}
