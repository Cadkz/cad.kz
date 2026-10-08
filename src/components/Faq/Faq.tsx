import { Plus } from 'lucide-react'
import styles from './Faq.module.css'

type Item = { question: string; answer: string }

/** Частые вопросы на нативных details: открываются без JavaScript и с клавиатуры. */
export function Faq({ items }: { items: Item[] }) {
  return (
    <div className={styles.list}>
      {items.map((item) => (
        <details key={item.question} className={styles.item}>
          <summary className={styles.question}>
            {item.question}
            <Plus size={20} strokeWidth={1.75} aria-hidden="true" className={styles.icon} />
          </summary>
          <p className={styles.answer}>{item.answer}</p>
        </details>
      ))}
    </div>
  )
}
