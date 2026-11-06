import { ChevronDown } from 'lucide-react'
import { getT } from '@/i18n/server'
import styles from './Toc.module.css'

type Item = { id: string; text: string }

/** Оглавление статьи. collapsed — свёрнутый вариант для телефона (над текстом). */
export async function Toc({ items, collapsed = false }: { items: Item[]; collapsed?: boolean }) {
  const t = await getT()
  if (items.length < 2) return null
  const list = (
    <ol className={styles.list}>
      {items.map((item) => (
        <li key={item.id}>
          <a href={`#${item.id}`} className={styles.link}>
            {item.text}
          </a>
        </li>
      ))}
    </ol>
  )
  if (collapsed)
    return (
      <details className={`${styles.box} ${styles.mobile}`}>
        <summary className={styles.summary}>
          {t('Содержание')}
          <ChevronDown size={16} strokeWidth={1.75} aria-hidden="true" />
        </summary>
        {list}
      </details>
    )
  return (
    <nav className={`${styles.box} ${styles.desktop}`} aria-label={t('Содержание')}>
      <p className={styles.title}>{t('Содержание')}</p>
      {list}
    </nav>
  )
}
