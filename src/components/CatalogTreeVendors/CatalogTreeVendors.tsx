'use client'

import { Folder, FolderOpen, Pencil } from 'lucide-react'
import { TreeActiveToggle } from '@/components/TreeActiveToggle/TreeActiveToggle'
import { TreeHeader } from '@/components/TreeHeader/TreeHeader'
import { TreeSortInput } from '@/components/TreeSortInput/TreeSortInput'
import { formatStamp } from '@/lib/format'
import type { CatalogTreeState } from '@/lib/useCatalogTree'
import styles from './CatalogTreeVendors.module.css'

/** Первый уровень вкладки: производители как папки, щелчок по названию открывает их товары. */
export function CatalogTreeVendors({ tree }: { tree: CatalogTreeState }) {
  const header = (label: string, column: string) => (
    <TreeHeader label={label} column={column} sort={tree.vendorSort} onSort={tree.setVendorSort} />
  )
  return (
    <div className={styles.scroll}>
      <table className={styles.table}>
        <thead>
          <tr>
            {header('Производитель', 'title')}
            {header('Товаров', 'count')}
            {header('Активность', 'published')}
            {header('Сорт.', 'order')}
            {header('Дата изм.', 'updatedAt')}
            {header('ID', 'id')}
            <th aria-label="Карточка производителя" />
          </tr>
        </thead>
        <tbody>
          {tree.vendorRows.map((row) => {
            const edit = { collection: 'manufacturers' as const, id: row.id, title: row.title }
            return (
              <tr key={row.id}>
                <td>
                  <button
                    type="button"
                    className={styles.folder}
                    onClick={() => tree.go({ group: tree.group, folder: row.id })}
                  >
                    <Folder size={20} strokeWidth={1.75} aria-hidden="true" />
                    {row.title}
                  </button>
                </td>
                <td>{row.count}</td>
                <td>
                  <TreeActiveToggle edit={edit} value={row.published} save={tree.save} />
                </td>
                <td>
                  <TreeSortInput edit={edit} value={row.order} save={tree.save} />
                </td>
                <td className={styles.muted}>{formatStamp(row.updatedAt)}</td>
                <td className={styles.muted}>{row.id}</td>
                <td>
                  <a
                    className={styles.edit}
                    href={`/admin/collections/manufacturers/${row.id}`}
                    title="Открыть карточку производителя"
                    aria-label={`Карточка: ${row.title}`}
                  >
                    <Pencil size={16} strokeWidth={1.75} aria-hidden="true" />
                  </a>
                </td>
              </tr>
            )
          })}
          {tree.orphans > 0 && (
            <tr>
              <td>
                <button
                  type="button"
                  className={styles.folder}
                  onClick={() => tree.go({ group: tree.group, folder: 'none' })}
                >
                  <FolderOpen size={20} strokeWidth={1.75} aria-hidden="true" />
                  Без производителя
                </button>
              </td>
              <td>{tree.orphans}</td>
              <td colSpan={5} className={styles.muted}>
                Товары, у которых не выбран производитель
              </td>
            </tr>
          )}
        </tbody>
      </table>
      {tree.vendorRows.length === 0 && tree.orphans === 0 && (
        <p className={styles.muted}>В этой вкладке пока нет товаров.</p>
      )}
    </div>
  )
}
