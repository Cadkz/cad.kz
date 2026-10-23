'use client'

import { useEffect, useState } from 'react'
import { parseSort } from '@/domain/adminCatalog.mjs'
import type { TreeEdit } from '@/lib/useCatalogTree'
import styles from './TreeSortInput.module.css'

/**
 * Ячейка «Сорт.»: число правится прямо в строке и сохраняется по Enter или когда курсор ушёл
 * из ячейки. Esc — вернуть как было.
 */
export function TreeSortInput({
  edit,
  value,
  save,
}: {
  edit: Omit<TreeEdit, 'field' | 'value' | 'was'>
  value: number | null
  save: (edit: TreeEdit) => Promise<boolean>
}) {
  const [text, setText] = useState(value == null ? '' : String(value))
  const [busy, setBusy] = useState(false)
  const parsed = parseSort(text)

  useEffect(() => setText(value == null ? '' : String(value)), [value])

  const commit = async () => {
    if (!parsed.ok || parsed.value === value || busy) return
    setBusy(true)
    const ok = await save({ ...edit, field: 'order', value: parsed.value, was: value })
    setBusy(false)
    if (!ok) setText(value == null ? '' : String(value))
  }

  return (
    <input
      className={parsed.ok ? styles.input : `${styles.input} ${styles.invalid}`}
      inputMode="numeric"
      aria-label={`Сорт.: ${edit.title}`}
      aria-invalid={!parsed.ok || undefined}
      title={parsed.ok ? 'Меньше — выше. Enter — сохранить' : 'Целое число от 0 до 999 999'}
      value={text}
      disabled={busy}
      onChange={(event) => setText(event.target.value)}
      onBlur={commit}
      onKeyDown={(event) => {
        if (event.key === 'Enter') event.currentTarget.blur()
        if (event.key === 'Escape') setText(value == null ? '' : String(value))
      }}
    />
  )
}
