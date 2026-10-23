'use client'

import { useState } from 'react'
import type { TreeEdit } from '@/lib/useCatalogTree'
import styles from './TreeActiveToggle.module.css'

/**
 * Ячейка «Активность», как в Битриксе: галочка — запись на сайте («Опубликовано»), без галочки —
 * черновик, на сайте не видна. Сохраняется сразу, под таблицей — «Отменить».
 */
export function TreeActiveToggle({
  edit,
  value,
  save,
}: {
  edit: Omit<TreeEdit, 'field' | 'value' | 'was'>
  value: boolean
  save: (edit: TreeEdit) => Promise<boolean>
}) {
  const [busy, setBusy] = useState(false)
  return (
    <label className={styles.root}>
      <input
        type="checkbox"
        checked={value}
        disabled={busy}
        onChange={async () => {
          setBusy(true)
          await save({ ...edit, field: 'published', value: !value, was: value })
          setBusy(false)
        }}
      />
      <span className={value ? styles.on : styles.off}>{value ? 'Да' : 'Нет'}</span>
      <span className={styles.hidden}>Активность: {edit.title}</span>
    </label>
  )
}
