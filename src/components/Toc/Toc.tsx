import { ChevronDown } from 'lucide-react'
import styles from './Toc.module.css'

type Item = { id: string; text: string }

/** Оглавление статьи. collapsed — свёрнутый вариант для телефона (над текстом). */
export function Toc({ items, collapsed = false }: { items: Item[]; collapsed?: boolean }) {
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
          Содержание
          <ChevronDown size={16} strokeWidth={1.75} aria-hidden="true" />
        </summary>
        {list}
      </details>
    )
  return (
    <nav className={`${styles.box} ${styles.desktop}`} aria-label="Содержание">
      <p className={styles.title}>Содержание</p>
      {list}
    </nav>
  )
}
