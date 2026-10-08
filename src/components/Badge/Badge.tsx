import type { ReactNode } from 'react'
import styles from './Badge.module.css'

type Props = { tone?: 'soft' | 'navy' | 'outline' | 'onDark'; children: ReactNode; dot?: boolean }

/** Бейдж: тематика, тип товара, служебная пометка. */
export function Badge({ tone = 'soft', children, dot = false }: Props) {
  return (
    <span className={`${styles.badge} ${styles[tone]}`}>
      {dot && <span className={styles.dot} aria-hidden="true" />}
      {children}
    </span>
  )
}
