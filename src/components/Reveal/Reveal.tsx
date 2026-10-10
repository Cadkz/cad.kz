import type { ReactNode } from 'react'
import styles from './Reveal.module.css'

type Props = {
  children: ReactNode
  /** li — когда обёртка сама элемент списка в сетке карточек. */
  as?: 'div' | 'li'
  /** Номер в ряду карточек (0, 1, 2): соседние появляются чуть позже друг друга. */
  step?: number
  className?: string
}

/** Первая карточка ряда — без задержки. */
const steps = [undefined, styles.step1, styles.step2]

/**
 * Плавное появление блока при прокрутке: прозрачность и подъём на 24 px.
 * Только CSS (анимация по прокрутке), без JavaScript; браузер без поддержки или
 * prefers-reduced-motion показывает блок сразу. Первый экран не оборачивать.
 */
export function Reveal({ children, as: Tag = 'div', step = 0, className }: Props) {
  const classes = [styles.reveal, steps[step % steps.length], className]
  return <Tag className={classes.filter(Boolean).join(' ')}>{children}</Tag>
}
