import { PAGE_TABS } from '@/domain/adminMenu.mjs'
import styles from './AdminTabs.module.css'

type Props = { set: keyof typeof PAGE_TABS; current: string }

/** Вкладки над страницами одного дела: «Цены» (таблица, прайс, курсы, НДС) и «Каталог». */
export function AdminTabs({ set, current }: Props) {
  return (
    <nav className={styles.tabs} aria-label="Разделы страницы">
      {PAGE_TABS[set].map((tab) => (
        <a
          key={tab.href}
          className={`${styles.tab} ${tab.href === current ? styles.current : ''}`}
          href={tab.href}
          aria-current={tab.href === current ? 'page' : undefined}
        >
          {tab.label}
        </a>
      ))}
    </nav>
  )
}
