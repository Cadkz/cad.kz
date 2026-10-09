import { FileSpreadsheet, History, Upload } from 'lucide-react'
import type { ServerProps } from 'payload'
import styles from './ImportDashboardLink.module.css'

/**
 * Плашки на главной странице админки: загрузка прайса (администратору и маркетологу), импорт из
 * Битрикса и перенос текстов (только администратору).
 */
export function ImportDashboardLink({ user }: ServerProps) {
  if (user?.role !== 'admin' && user?.role !== 'editor') return null
  const price = (
    <a className={styles.card} href="/admin/price-list">
      <FileSpreadsheet size={20} strokeWidth={1.75} aria-hidden />
      <span>
        <span className={styles.title}>Загрузить прайс</span>
        <span className={styles.text}>Excel производителя — пересчёт цен всех его позиций</span>
      </span>
    </a>
  )
  if (user.role !== 'admin') return <div className={styles.row}>{price}</div>
  return (
    <div className={styles.row}>
      {price}
      <a className={styles.card} href="/admin/import-bitrix">
        <Upload size={20} strokeWidth={1.75} aria-hidden />
        <span>
          <span className={styles.title}>Импорт из Битрикса</span>
          <span className={styles.text}>
            Загрузить выгрузки старого cad.kz: товары, цены, картинки
          </span>
        </span>
      </a>
      <a className={styles.card} href="/admin/legacy-content">
        <History size={20} strokeWidth={1.75} aria-hidden />
        <span>
          <span className={styles.title}>Перенос со старого сайта</span>
          <span className={styles.text}>
            Новости, акции, статьи и title/description товаров со старого cad.kz
          </span>
        </span>
      </a>
    </div>
  )
}
