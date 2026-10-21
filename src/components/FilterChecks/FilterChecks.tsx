'use client'

import { ChevronDown } from 'lucide-react'
import { useState } from 'react'
import styles from './FilterChecks.module.css'

type Option = { value: string; label: string; count: number }

/**
 * Список галочек фильтра каталога (производители, задачи). С limit длинный список свёрнут:
 * видны первые пункты и отмеченные, остальные — по кнопке «Ещё N».
 */
export function FilterChecks({
  title,
  options,
  selected,
  onToggle,
  limit,
}: {
  title: string
  options: Option[]
  selected: string[]
  onToggle: (value: string) => void
  /** Показать сначала столько пунктов; отмеченные видны всегда. */
  limit?: number
}) {
  const [expanded, setExpanded] = useState(false)
  if (!options.length) return null
  const folded = limit !== undefined && !expanded && options.length > limit + 1
  const visible = folded
    ? options.filter((option, index) => index < limit || selected.includes(option.value))
    : options
  const hidden = options.length - visible.length
  return (
    <fieldset className={styles.group}>
      <legend className={styles.title}>{title}</legend>
      {visible.map((option) => (
        <label key={option.value} className={styles.check}>
          <input
            type="checkbox"
            checked={selected.includes(option.value)}
            disabled={option.count === 0 && !selected.includes(option.value)}
            onChange={() => onToggle(option.value)}
          />
          <span className={styles.checkLabel}>{option.label}</span>
        </label>
      ))}
      {limit !== undefined && (folded || expanded) && (
        <button
          type="button"
          className={styles.toggle}
          aria-expanded={expanded}
          onClick={() => setExpanded(!expanded)}
        >
          {expanded ? 'Свернуть' : `Ещё ${hidden}`}
          <ChevronDown
            size={16}
            strokeWidth={1.75}
            aria-hidden="true"
            className={expanded ? styles.toggleIconOpen : undefined}
          />
        </button>
      )}
    </fieldset>
  )
}
