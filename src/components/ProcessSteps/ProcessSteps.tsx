import { BookOpen, FileText, MessageSquare } from 'lucide-react'
import type { Home } from '@/lib/home'
import styles from './ProcessSteps.module.css'

const icons = [MessageSquare, FileText, BookOpen]

/**
 * Шаги работы с клиентом линией с точками, без карточек: на компьютере — слева направо,
 * на телефоне — сверху вниз с линией слева. Точка — кружок с иконкой шага.
 */
export function ProcessSteps({ steps }: { steps: Home['process'] }) {
  return (
    <ol className={styles.list}>
      {steps.map((step, i) => {
        const Icon = icons[i % icons.length] ?? MessageSquare
        return (
          <li key={step.title} className={styles.step}>
            <span className={styles.node}>
              <Icon size={20} strokeWidth={1.75} aria-hidden="true" />
            </span>
            <div className={styles.body}>
              <span className={styles.num}>Шаг {i + 1}</span>
              <h3 className={styles.title}>{step.title}</h3>
              {step.text && <p className={styles.text}>{step.text}</p>}
            </div>
          </li>
        )
      })}
    </ol>
  )
}
