import type { ReactNode } from 'react'
import styles from './HomeExperience.module.css'

/** Новый макет только для ПК. Мобильная главная сохраняет прежнюю композицию. */
export function HomeExperience({ desktop, children }: { desktop: ReactNode; children: ReactNode }) {
  return (
    <>
      <div className={styles.desktop}>{desktop}</div>
      <div className={styles.mobile}>{children}</div>
    </>
  )
}
