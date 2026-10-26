import { ChevronDown } from 'lucide-react'
import type { ReactNode } from 'react'
import styles from './MobileMenuGroup.module.css'

/** Раскрывающаяся строка. Одно имя у соседних — открыта только одна, экран не тонет в списках. */
export function MobileMenuGroup({
  title,
  name,
  open,
  children,
}: {
  title: string
  name: string
  open?: boolean
  children: ReactNode
}) {
  return (
    <details
      className={styles.group}
      name={name}
      open={open}
      onToggle={(event) => {
        if (event.currentTarget.open)
          event.currentTarget.querySelector('summary')?.scrollIntoView({ block: 'nearest' })
      }}
    >
      <summary className={styles.summary}>
        {title}
        <ChevronDown size={20} strokeWidth={1.75} className={styles.chevron} aria-hidden="true" />
      </summary>
      <div className={styles.groupBody}>{children}</div>
    </details>
  )
}
