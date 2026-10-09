import { History, Upload } from 'lucide-react'
import type { ServerProps } from 'payload'
import styles from './ImportDashboardLink.module.css'

/** Плашки на главной странице админки: импорт из Битрикса и перенос текстов. Только администратору. */
export function ImportDashboardLink({ user }: ServerProps) {
  if (user?.role !== 'admin') return null
  return (
    <div className={styles.row}>
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
