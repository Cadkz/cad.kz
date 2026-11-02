import type { ReactNode } from 'react'
import { Morph } from '../Morph/Morph'
import styles from './PageIntro.module.css'

/** Заголовок страницы: h1 и вводный абзац не шире --measure. */
type Props = {
  title: string
  lead?: string | null
  meta?: ReactNode
  children?: ReactNode
  /** Ключ перехода: заголовок перелетает сюда из карточки списка (Morph). */
  morphId?: string
}

export function PageIntro({ title, lead, meta, children, morphId }: Props) {
  return (
    <header className={styles.intro}>
      {children}
      <Morph id={morphId} part="title">
        <h1>{title}</h1>
      </Morph>
      {lead && <p className={styles.lead}>{lead}</p>}
      {meta && <p className={styles.meta}>{meta}</p>}
    </header>
  )
}
