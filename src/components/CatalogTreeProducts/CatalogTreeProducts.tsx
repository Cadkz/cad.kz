'use client'

import { TreeActiveToggle } from '@/components/TreeActiveToggle/TreeActiveToggle'
import { TreeHeader } from '@/components/TreeHeader/TreeHeader'
import { TreeSortInput } from '@/components/TreeSortInput/TreeSortInput'
import { formatStamp } from '@/lib/format'
import type { CatalogTreeState } from '@/lib/useCatalogTree'
import styles from './CatalogTreeProducts.module.css'

const TONE = { ok: styles.ok, muted: styles.muted, warn: styles.warn }

/**
 * Товары производителя (или найденные поиском по вкладке): тип, название, линейка, активность,
 * «Сорт.», место в топе, доступность, дата, ID. Название открывает карточку товара.
 */
export function CatalogTreeProducts({ tree }: { tree: CatalogTreeState }) {
  const searching = tree.query.trim() !== ''
  const header = (label: string, column: string) => (
    <TreeHeader
      label={label}
      column={column}
      sort={tree.productSort}
      onSort={tree.setProductSort}
    />
  )
  if (!tree.productRows.length)
    return (
      <p className={styles.muted}>
        {searching ? 'В этой вкладке ничего не нашлось.' : 'У производителя здесь нет товаров.'}
      </p>
    )
  return (
    <div className={styles.scroll}>
      <table className={styles.table}>
        <thead>
          <tr>
            {header('Тип', 'kind')}
            {header('Название', 'title')}
            {searching && <th>Производитель</th>}
            {header('Линейка', 'line')}
            {header('Активность', 'published')}
            {header('Сорт.', 'order')}
            {header('Топ', 'top')}
            {header('Доступность', 'availability')}
            {header('Дата изм.', 'updatedAt')}
            {header('ID', 'id')}
          </tr>
        </thead>
        <tbody>
          {tree.productRows.map((row) => {
            const edit = { collection: 'products' as const, id: row.id, title: row.title }
            return (
              <tr key={row.id}>
                <td className={styles.muted}>{row.kind}</td>
                <td className={styles.name}>
                  <a href={`/admin/collections/products/${row.id}`}>{row.title}</a>
                </td>
                {searching && (
                  <td className={styles.muted}>
                    {tree.vendorTitle(row.vendor ?? 'none') || 'Без производителя'}
                  </td>
                )}
                <td className={styles.muted}>{row.line ?? '—'}</td>
                <td>
                  <TreeActiveToggle edit={edit} value={row.published} save={tree.save} />
                </td>
                <td>
                  <TreeSortInput edit={edit} value={row.order} save={tree.save} />
                </td>
                <td className={styles.muted}>{row.top ?? '—'}</td>
                <td className={TONE[row.tone]}>{row.availability}</td>
                <td className={styles.muted}>{formatStamp(row.updatedAt)}</td>
                <td className={styles.muted}>{row.id}</td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
