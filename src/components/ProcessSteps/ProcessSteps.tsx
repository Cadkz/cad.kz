import { BookOpen, FileText, MessageSquare } from 'lucide-react'
import type { Home } from '@/lib/home'
import { Grid } from '../Grid/Grid'
import styles from './ProcessSteps.module.css'

const icons = [MessageSquare, FileText, BookOpen]

/** Три шага работы с клиентом: номер, иконка, заголовок, описание. */
export function ProcessSteps({ steps }: { steps: Home['process'] }) {
  return (
    <Grid as="ul" span={{ base: 12, md: 4 }}>
      {steps.map((step, i) => {
        const Icon = icons[i % icons.length] ?? MessageSquare
        return (
          <li key={step.title} className={styles.card}>
            <div className={styles.top}>
              <span className={styles.num}>{i + 1}</span>
              <Icon size={24} strokeWidth={1.75} aria-hidden="true" className={styles.icon} />
            </div>
            <div className={styles.body}>
              <h3 className={styles.title}>{step.title}</h3>
              {step.text && <p className={styles.text}>{step.text}</p>}
            </div>
          </li>
        )
      })}
    </Grid>
  )
}
