import type { ServerProps } from 'payload'
import styles from './ImportNavLink.module.css'

/**
 * Свои страницы в меню админки: «Загрузить прайс» — администратору и маркетологу,
 * «Импорт из Битрикса» и «Перенос со старого сайта» — только администратору.
 */
export function ImportNavLink({ user }: ServerProps) {
  if (user?.role !== 'admin' && user?.role !== 'editor') return null
  const price = (
    <a className={styles.link} href="/admin/price-list">
      Загрузить прайс
    </a>
  )
  if (user.role !== 'admin') return price
  return (
    <>
      {price}
      <a className={styles.link} href="/admin/import-bitrix">
        Импорт из Битрикса
      </a>
      <a className={styles.link} href="/admin/legacy-content">
        Перенос со старого сайта
      </a>
    </>
  )
}
