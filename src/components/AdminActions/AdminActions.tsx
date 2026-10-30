import { FileSpreadsheet, Inbox, ListChecks, type LucideIcon, Plus } from 'lucide-react'
import styles from './AdminActions.module.css'

type Action = { label: string; href: string; icon: LucideIcon; main?: boolean; admin?: boolean }

/**
 * Самое частое — одной кнопкой (исследование ChatGPT, 30.10.2026): новый товар, новость, акция,
 * загрузка прайса, заявки, проверка каталога. Каталог, цены и курсы — в меню и в «Системе».
 */
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
  { label: 'Загрузить прайс', href: '/admin/price-list', icon: FileSpreadsheet },
  { label: 'Заявки', href: '/admin/collections/site-requests', icon: Inbox, admin: true },
  { label: 'Контроль качества', href: '/admin/quality', icon: ListChecks },
]

/** Быстрые кнопки над очередью работы на главной админки. Заявки видит только администратор. */
export function AdminActions({ admin }: { admin: boolean }) {
  return (
    <nav className={styles.row} aria-label="Быстрые действия">
      {ACTIONS.filter((action) => admin || !action.admin).map(
        ({ label, href, icon: Icon, main }) => (
          <a key={href} className={`${styles.button} ${main ? styles.main : ''}`} href={href}>
            <Icon size={16} strokeWidth={1.75} aria-hidden />
            {label}
          </a>
        ),
      )}
    </nav>
  )
}
