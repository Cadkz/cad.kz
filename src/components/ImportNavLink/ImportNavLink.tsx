import type { ServerProps } from 'payload'
import styles from './ImportNavLink.module.css'

/** Пункты «Импорт из Битрикса» и «Перенос со старого сайта» в меню админки. Только администратору. */
export function ImportNavLink({ user }: ServerProps) {
  if (user?.role !== 'admin') return null
  return (
    <>
      <a className={styles.link} href="/admin/import-bitrix">
        Импорт из Битрикса
      </a>
      <a className={styles.link} href="/admin/legacy-content">
        Перенос со старого сайта
      </a>
    </>
  )
}
