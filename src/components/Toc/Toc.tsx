import { ChevronDown } from 'lucide-react'
import styles from './Toc.module.css'

type Item = { id: string; text: string }

/** Оглавление статьи: свёрнутый блок над текстом (шаблон «Чтение» — одна колонка по центру). */
export function Toc({ items }: { items: Item[] }) {
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
  return (
    <details className={styles.box}>
      <summary className={styles.summary}>
        Содержание
        <ChevronDown size={16} strokeWidth={1.75} aria-hidden="true" />
      </summary>
      <nav aria-label="Содержание">{list}</nav>
    </details>
  )
}
