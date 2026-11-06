import Link from '@/components/LangLink/LangLink'
import { getT } from '@/i18n/server'
import { publicationTabs } from '@/lib/siteNav'
import styles from './PublicationTabs.module.css'

/**
 * «Новости и статьи» — один раздел с переключателем типа публикаций над заголовком.
 * Каждый тип — своя страница со своим адресом (/news, /articles), адреса не менялись.
 */
export async function PublicationTabs({
  current,
  tabs = publicationTabs,
  label = 'Новости и статьи',
}: {
  current: string
  /** Свои вкладки: у акций — «Действующие» и «Архивные». */
  tabs?: { title: string; href: string }[]
  label?: string
}) {
  const t = await getT()
  return (
    <nav aria-label={t(label)} className={styles.tabs}>
      {tabs.map((tab) => (
        <Link
          key={tab.href}
          href={tab.href}
          className={styles.tab}
          aria-current={tab.href === current ? 'page' : undefined}
        >
          {t(tab.title)}
        </Link>
      ))}
    </nav>
  )
}
