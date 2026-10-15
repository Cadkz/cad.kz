import { CircleCheck } from 'lucide-react'
import { AdminQueueCard } from '@/components/AdminQueueCard/AdminQueueCard'
import type { QueueCard } from '@/lib/adminQueue'
import styles from './AdminCardGrid.module.css'

/**
 * Карточки задач сеткой (главная админки, «Контроль качества»). Задачи без дел сворачиваются
 * в одну строку «В порядке: …», чтобы на виду было только то, что надо сделать.
 */
export function AdminCardGrid({ cards }: { cards: QueueCard[] }) {
  const isDone = (card: QueueCard) => !card.always && card.total === 0 && card.items.length === 0
  const open = cards.filter((card) => !isDone(card))
  const done = cards.filter(isDone)
  return (
    <>
      {open.length > 0 && (
        <div className={styles.grid}>
          {open.map((card) => (
            <AdminQueueCard key={card.key} card={card} />
          ))}
        </div>
      )}
      {done.length > 0 && (
        <p className={styles.done}>
          <CircleCheck size={16} strokeWidth={1.75} aria-hidden />
          <span>В порядке: {done.map((card) => card.title.toLowerCase()).join(', ')}.</span>
        </p>
      )}
    </>
  )
}
