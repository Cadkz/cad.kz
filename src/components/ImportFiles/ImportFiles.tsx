'use client'

import { CircleCheck, CircleDashed, FileWarning } from 'lucide-react'
import { FILE_KINDS, type ReadFile } from '@/lib/bitrixImportClient'
import styles from './ImportFiles.module.css'

type Props = {
  files: ReadFile[]
  busy: boolean
  onChoose: (files: File[]) => void
}

const ICON = { size: 16, strokeWidth: 1.75, 'aria-hidden': true } as const

/** Выбор выгрузок Битрикса и список: какой файл каким видом узнан, чего не хватает. */
export function ImportFiles({ files, busy, onChoose }: Props) {
  const unknown = files.filter((f) => !f.kind)
  return (
    <div className={styles.root}>
      <label className={styles.picker}>
        <span>Выберите сразу все четыре файла выгрузки (имена любые):</span>
        <input
          className={styles.input}
          type="file"
          multiple
          accept=".csv,.xls,.html,.htm"
          disabled={busy}
          onChange={(event) => {
            const list = [...(event.target.files ?? [])]
            if (list.length) onChoose(list)
          }}
        />
      </label>
      <ul className={styles.kinds}>
        {FILE_KINDS.map(({ kind, title, required }) => {
          const file = files.find((f) => f.kind === kind)
          return (
            <li key={kind} className={file ? styles.found : styles.missing}>
              {file ? <CircleCheck {...ICON} /> : <CircleDashed {...ICON} />}
              <span>
                {title}
                {!required && ' — без него цены не перенесутся'}
                {file && (
                  <span className={styles.name}>
                    {' '}
                    · {file.name}, строк {file.rows}
                  </span>
                )}
              </span>
            </li>
          )
        })}
        {unknown.map((file) => (
          <li key={file.name} className={styles.missing}>
            <FileWarning {...ICON} />
            <span>{file.name} — не похоже на выгрузку каталога, пропущен</span>
          </li>
        ))}
      </ul>
    </div>
  )
}
