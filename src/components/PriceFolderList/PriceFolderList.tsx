'use client'

import { Folder, FolderOpen } from 'lucide-react'
import type { PriceGridState } from '@/lib/usePriceGrid'
import styles from './PriceFolderList.module.css'

/**
 * Первый уровень вкладки «Цен»: производители папками, как в «Каталоге». Щелчок открывает
 * товары производителя с комплектациями и ценами.
 */
export function PriceFolderList({ grid }: { grid: PriceGridState }) {
  if (!grid.folders.length)
    return <p className={styles.muted}>В этой вкладке пока нет товаров с комплектациями.</p>
  return (
    <div className={styles.scroll}>
      <table className={styles.table}>
        <thead>
          <tr>
            <th>Производитель</th>
            <th>Товаров</th>
            <th>Комплектаций</th>
            <th>Без цены</th>
          </tr>
        </thead>
        <tbody>
          {grid.folders.map((folder) => {
            const Icon = folder.vendor === 'none' ? FolderOpen : Folder
            return (
              <tr key={folder.vendor}>
                <td>
                  <button
                    type="button"
                    className={styles.folder}
                    onClick={() => grid.go({ group: grid.filter.group, vendor: folder.vendor })}
                  >
                    <Icon size={20} strokeWidth={1.75} aria-hidden="true" />
                    {folder.title}
                  </button>
                </td>
                <td>{folder.products}</td>
                <td>{folder.offers}</td>
                <td className={folder.noPrice ? styles.warn : styles.muted}>
                  {folder.noPrice || '—'}
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
