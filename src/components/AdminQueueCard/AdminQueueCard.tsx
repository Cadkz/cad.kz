import { ArrowRight } from 'lucide-react'
import type { QueueCard } from '@/lib/adminQueue'
import styles from './AdminQueueCard.module.css'

/** Карточка очереди работы на главной админки: заголовок с числом, до пяти ссылок, «Все». */
export function AdminQueueCard({ card }: { card: QueueCard }) {
  const done = card.total === 0 && card.items.length === 0
  return (
    <section
      className={`${styles.card} ${card.tone === 'alert' ? styles.alert : ''} ${done ? styles.done : ''}`}
      aria-labelledby={`queue-${card.key}`}
    >
      <header className={styles.head}>
        <h3 className={styles.title} id={`queue-${card.key}`}>
          {card.title}
        </h3>
        {card.total > 0 && <span className={styles.count}>{card.total}</span>}
      </header>
      {card.hint && !done && <p className={styles.hint}>{card.hint}</p>}
      {card.items.length > 0 ? (
        <ul className={styles.list}>
          {card.items.map((item) => (
            <li key={item.id}>
              <a className={styles.link} href={item.href}>
                <span className={styles.itemTitle}>{item.title}</span>
                {item.note && <span className={styles.note}>{item.note}</span>}
              </a>
            </li>
          ))}
        </ul>
      ) : (
        <p className={styles.empty}>{card.empty}</p>
      )}
      {card.more && (
        <a className={styles.more} href={card.more.href}>
          {card.more.label}
          <ArrowRight size={16} strokeWidth={1.75} aria-hidden />
        </a>
      )}
    </section>
  )
}
