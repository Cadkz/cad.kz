'use client'

import { useId, useState } from 'react'
import { AdminButton } from '../AdminButton/AdminButton'
import styles from './EditorPrompt.module.css'

type Props = {
  label: string
  placeholder: string
  hint?: string
  /** Проверка адреса: текст ошибки или null. */
  check: (value: string) => string | null
  onSubmit: (value: string) => void
  onCancel: () => void
}

/** Строка ввода адреса под кнопками редактора (ссылка, видео) — вместо окна браузера. */
export function EditorPrompt({ label, placeholder, hint, check, onSubmit, onCancel }: Props) {
  const id = useId()
  const [value, setValue] = useState('')
  const [error, setError] = useState<string | null>(null)
  const submit = () => {
    const problem = check(value.trim())
    if (problem) setError(problem)
    else onSubmit(value.trim())
  }
  return (
    <div className={styles.root}>
      <label htmlFor={id} className={styles.label}>
        {label}
      </label>
      <div className={styles.row}>
        <input
          id={id}
          className={styles.input}
          // biome-ignore lint/a11y/noAutofocus: строка открывается по кнопке, адрес вводят сразу
          autoFocus
          value={value}
          placeholder={placeholder}
          onChange={(event) => {
            setValue(event.target.value)
            setError(null)
          }}
          onKeyDown={(event) => {
            if (event.key === 'Enter') {
              event.preventDefault()
              submit()
            }
            if (event.key === 'Escape') onCancel()
          }}
        />
        <AdminButton onClick={submit}>Вставить</AdminButton>
        <AdminButton secondary onClick={onCancel}>
          Отмена
        </AdminButton>
      </div>
      {error ? (
        <p className={styles.error} role="alert">
          {error}
        </p>
      ) : (
        hint && <p className={styles.hint}>{hint}</p>
      )}
    </div>
  )
}
