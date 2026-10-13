import type { ReactNode } from 'react'
import styles from './Reveal.module.css'

type Props = {
  children: ReactNode
  /** li — когда обёртка сама элемент списка в сетке карточек. */
  as?: 'div' | 'li'
  /** Номер в ряду карточек (0, 1, 2, 3, …): соседние появляются чуть позже друг друга. */
  step?: number
  className?: string
}

/** Первая карточка ряда — без задержки; ряд — до 4 карточек. */
const steps = [undefined, styles.step1, styles.step2, styles.step3]

/**
 * Плавное появление блока при прокрутке: прозрачность и подъём на 24 px. Когда блок вошёл
 * в экран, анимация идёт по времени до конца (RevealObserver в общем layout), поэтому она
 * гладкая при любой прокрутке — колёсиком, тачпадом, пальцем. Без JavaScript и при
 * prefers-reduced-motion блок виден сразу. Первый экран не оборачивать.
 */
export function Reveal({ children, as: Tag = 'div', step = 0, className }: Props) {
  const classes = [styles.reveal, steps[step % steps.length], className]
  return (
    <Tag className={classes.filter(Boolean).join(' ')} data-reveal="">
      {children}
    </Tag>
  )
}
