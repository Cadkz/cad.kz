import { Coins, FileSpreadsheet, type LucideIcon, Plus, Table } from 'lucide-react'
import styles from './AdminActions.module.css'

type Action = { label: string; href: string; icon: LucideIcon; main?: boolean }

/** Самое частое — одной кнопкой: новый товар, новость, акция, цены, прайс, курсы. */
const ACTIONS: Action[] = [
  { label: 'Товар', href: '/admin/collections/products/create', icon: Plus, main: true },
  {
    label: 'Новость',
    href: '/admin/collections/publications/create?kind=news',
    icon: Plus,
    main: true,
  },
  {
    label: 'Акция',
    href: '/admin/collections/publications/create?kind=promotion',
    icon: Plus,
    main: true,
  },
  { label: 'Цены таблицей', href: '/admin/prices', icon: Table },
  { label: 'Загрузить прайс', href: '/admin/price-list', icon: FileSpreadsheet },
  { label: 'Курсы валют', href: '/admin/rates', icon: Coins },
]

/** Быстрые кнопки над очередью работы на главной админки. */
export function AdminActions() {
  return (
    <nav className={styles.row} aria-label="Быстрые действия">
      {ACTIONS.map(({ label, href, icon: Icon, main }) => (
        <a key={href} className={`${styles.button} ${main ? styles.main : ''}`} href={href}>
          <Icon size={16} strokeWidth={1.75} aria-hidden />
          {label}
        </a>
      ))}
    </nav>
  )
}
