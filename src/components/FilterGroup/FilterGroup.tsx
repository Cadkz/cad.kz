'use client'

import { ChevronRight } from 'lucide-react'
import { type ReactNode, useState } from 'react'
import styles from './FilterGroup.module.css'

/**
 * Группа фильтра каталога: заголовок-надстрочник со стрелкой «›» слева (п. 4 плана владельца
 * 06.11.2026 — видно, что группа раскрывается). Открытая группа — стрелка вниз. Группа
 * с выбранным значением при загрузке всегда открыта.
 */
export function FilterGroup({
  title,
  children,
  defaultOpen = true,
  hasSelection = false,
}: {
  title: string
  children: ReactNode
  /** Открыта ли группа сначала. */
  defaultOpen?: boolean
  /** Есть ли в группе выбранное значение — тогда она открыта сразу. */
  hasSelection?: boolean
}) {
  const [open, setOpen] = useState(defaultOpen || hasSelection)
  return (
    <fieldset className={styles.group}>
      <legend className={styles.legend}>
        <button
          type="button"
          className={styles.heading}
          aria-expanded={open}
          onClick={() => setOpen(!open)}
        >
          <ChevronRight
            size={16}
            strokeWidth={1.75}
            aria-hidden="true"
            className={open ? `${styles.icon} ${styles.iconOpen}` : styles.icon}
          />
          {title}
        </button>
      </legend>
      {open && children}
    </fieldset>
  )
}
