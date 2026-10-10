import Link from 'next/link'
import { publicationTabs } from '@/lib/siteNav'
import styles from './PublicationTabs.module.css'

/**
 * «Новости и статьи» — один раздел с переключателем типа публикаций над заголовком.
 * Каждый тип — своя страница со своим адресом (/news, /articles), адреса не менялись.
 */
export function PublicationTabs({ current }: { current: string }) {
  return (
    <nav aria-label="Новости и статьи" className={styles.tabs}>
      {publicationTabs.map((tab) => (
        <Link
          key={tab.href}
          href={tab.href}
          className={styles.tab}
          aria-current={tab.href === current ? 'page' : undefined}
        >
          {tab.title}
        </Link>
      ))}
    </nav>
  )
}
