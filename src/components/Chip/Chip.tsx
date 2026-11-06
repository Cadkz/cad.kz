import type { ButtonHTMLAttributes } from 'react'
import styles from './Chip.module.css'

type Props = ButtonHTMLAttributes<HTMLButtonElement> & {
  selected?: boolean
  count?: number
  /** pill — плашка-переключатель вкладки; option — строка списка фильтра со счётчиком. */
  look?: 'pill' | 'option'
  /** soft — выбранная вкладка мягкой подсветкой вместо сплошной заливки (вкладки каталога). */
  soft?: boolean
}

/** Переключатель фильтра. Выбранное состояние передаётся в aria-pressed. */
export function Chip({
  selected = false,
  count,
  look = 'pill',
  soft = false,
  className,
  children,
  ...rest
}: Props) {
  return (
    <button
      type="button"
      aria-pressed={selected}
      className={[styles.chip, styles[look], soft && styles.soft, className]
        .filter(Boolean)
        .join(' ')}
      {...rest}
    >
      <span className={styles.label}>{children}</span>
      {count !== undefined && <span className={styles.count}>{count}</span>}
    </button>
  )
}
