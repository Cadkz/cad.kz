import Link from 'next/link'
import type { MenuColumn } from '@/lib/navigation'
import { CatalogEntry } from '../CatalogEntry/CatalogEntry'
import styles from './MenuDrill.module.css'

/** В меню сразу товары; продолжение выдачи открывается с теми же условиями в каталоге. */
export function MenuDrill({ column, onNavigate }: { column: MenuColumn; onNavigate: () => void }) {
  return (
    <div className={styles.root}>
      <p className={styles.count} aria-live="polite">
        {column.title}
      </p>
      <ul className={styles.cards}>
        {column.items.map((item) => (
          <li key={item.id}>
            <CatalogEntry product={item} onNavigate={onNavigate} />
          </li>
        ))}
      </ul>
      <Link href={column.allHref} className={styles.all} onClick={onNavigate}>
        Открыть список в каталоге →
      </Link>
    </div>
  )
}
