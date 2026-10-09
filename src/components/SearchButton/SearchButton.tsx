import { Search } from 'lucide-react'
import Link from 'next/link'
import styles from './SearchButton.module.css'

/** Значок поиска в шапке: ведёт на страницу поиска, где поле сразу в фокусе. */
export function SearchButton() {
  return (
    <Link href="/search" className={styles.button} aria-label="Поиск по каталогу">
      <Search size={20} strokeWidth={1.75} aria-hidden="true" />
    </Link>
  )
}
