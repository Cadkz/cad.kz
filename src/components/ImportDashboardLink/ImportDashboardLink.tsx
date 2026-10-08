import { Upload } from 'lucide-react'
import type { ServerProps } from 'payload'
import styles from './ImportDashboardLink.module.css'

/** Плашка на главной странице админки: вход в импорт из Битрикса. Видна только администратору. */
export function ImportDashboardLink({ user }: ServerProps) {
  if (user?.role !== 'admin') return null
  return (
    <a className={styles.card} href="/admin/import-bitrix">
      <Upload size={20} strokeWidth={1.75} aria-hidden />
      <span>
        <span className={styles.title}>Импорт из Битрикса</span>
        <span className={styles.text}>
          Загрузить выгрузки старого cad.kz: товары, цены, картинки
        </span>
      </span>
    </a>
  )
}
