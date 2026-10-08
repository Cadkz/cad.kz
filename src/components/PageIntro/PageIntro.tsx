import type { ReactNode } from 'react'
import styles from './PageIntro.module.css'

/** Заголовок страницы: h1 и вводный абзац не шире --measure. */
type Props = { title: string; lead?: string | null; meta?: ReactNode; children?: ReactNode }

export function PageIntro({ title, lead, meta, children }: Props) {
  return (
    <header className={styles.intro}>
      {children}
      <h1>{title}</h1>
      {lead && <p className={styles.lead}>{lead}</p>}
      {meta && <p className={styles.meta}>{meta}</p>}
    </header>
  )
}
