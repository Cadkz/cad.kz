'use client'

import { ChevronDown } from 'lucide-react'
import { useState } from 'react'
import styles from './FilterChecks.module.css'

type Option = { value: string; label: string; count: number }

/**
 * Список галочек фильтра каталога (производители, задачи, характеристики). С limit длинный список
 * свёрнут: видны первые пункты и отмеченные, остальные — по кнопке «Показать ещё». С collapsible
 * группа целиком сворачивается по заголовку со стрелкой (образец владельца 23.10.2026);
 * группа с отмеченным значением всегда открыта при загрузке.
 */
export function FilterChecks({
  title,
  options,
  selected,
  onToggle,
  limit,
  collapsible = false,
  defaultOpen = true,
}: {
  title: string
  options: Option[]
  selected: string[]
  onToggle: (value: string) => void
  /** Показать сначала столько пунктов; отмеченные видны всегда. */
  limit?: number
  /** Заголовок сворачивает группу. */
  collapsible?: boolean
  /** Открыта ли сворачиваемая группа сначала. */
  defaultOpen?: boolean
}) {
  const [expanded, setExpanded] = useState(false)
  const [open, setOpen] = useState(defaultOpen || selected.length > 0)
  if (!options.length) return null
  const folded = limit !== undefined && !expanded && options.length > limit + 1
  const visible = folded
    ? options.filter((option, index) => index < limit || selected.includes(option.value))
    : options
  const hidden = options.length - visible.length
  return (
    <fieldset className={styles.group}>
      {collapsible ? (
        <legend className={styles.legend}>
          <button
            type="button"
            className={styles.heading}
            aria-expanded={open}
            onClick={() => setOpen(!open)}
          >
            {title}
            <ChevronDown
              size={16}
              strokeWidth={1.75}
              aria-hidden="true"
              className={open ? undefined : styles.headingIconClosed}
            />
          </button>
        </legend>
      ) : (
        <legend className={styles.title}>{title}</legend>
      )}
      {(!collapsible || open) &&
        visible.map((option) => (
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
      {(!collapsible || open) && limit !== undefined && (folded || expanded) && (
        <button
          type="button"
          className={styles.toggle}
          aria-expanded={expanded}
          onClick={() => setExpanded(!expanded)}
        >
          {expanded ? 'Свернуть' : collapsible ? 'Показать ещё' : `Ещё ${hidden}`}
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
