import type { ServerProps } from 'payload'
import styles from './ImportNavLink.module.css'

/** Пункт «Импорт из Битрикса» в меню админки. Виден только администратору. */
export function ImportNavLink({ user }: ServerProps) {
  if (user?.role !== 'admin') return null
  return (
    <a className={styles.link} href="/admin/import-bitrix">
      Импорт из Битрикса
    </a>
  )
}
