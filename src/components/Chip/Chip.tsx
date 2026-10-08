import type { ButtonHTMLAttributes } from 'react'
import styles from './Chip.module.css'

type Props = ButtonHTMLAttributes<HTMLButtonElement> & {
  selected?: boolean
  count?: number
  /** pill — плашка-переключатель вкладки; option — строка списка фильтра со счётчиком. */
  look?: 'pill' | 'option'
}

/** Переключатель фильтра. Выбранное состояние передаётся в aria-pressed. */
export function Chip({
  selected = false,
  count,
  look = 'pill',
  className,
  children,
  ...rest
}: Props) {
  return (
    <button
      type="button"
      aria-pressed={selected}
      className={[styles.chip, styles[look], className].filter(Boolean).join(' ')}
      {...rest}
    >
      <span className={styles.label}>{children}</span>
      {count !== undefined && <span className={styles.count}>{count}</span>}
    </button>
  )
}
