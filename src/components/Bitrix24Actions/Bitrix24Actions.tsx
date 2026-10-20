'use client'

import { useState } from 'react'
import { AdminButton } from '@/components/AdminButton/AdminButton'
import { adminCall } from '@/lib/adminCall'
import styles from './Bitrix24Actions.module.css'

type Result = { message: string; link?: string; details?: string[] }
type Action = 'check' | 'testLead' | 'retry'

const LABELS: Record<Action, [string, string]> = {
  check: ['Проверить связь', 'Проверяю…'],
  testLead: ['Отправить тестовый лид', 'Отправляю…'],
  retry: ['Дослать отложенные', 'Досылаю…'],
}

/** Кнопки страницы «Битрикс24»: каждая — один запрос к порталу, итог текстом под кнопками. */
export function Bitrix24Actions() {
  const [busy, setBusy] = useState<Action | null>(null)
  const [result, setResult] = useState<Result | null>(null)
  const [error, setError] = useState('')

  async function run(action: Action) {
    setBusy(action)
    setResult(null)
    setError('')
    try {
      setResult(await adminCall<Result>('/api/admin/bitrix24', { action }))
    } catch (failure) {
      setError(failure instanceof Error ? failure.message : 'Не получилось. Повторите.')
    } finally {
      setBusy(null)
    }
  }

  return (
    <div className={styles.root}>
      <div className={styles.actions}>
        {(Object.keys(LABELS) as Action[]).map((action) => (
          <AdminButton
            key={action}
            secondary={action !== 'check'}
            onClick={() => run(action)}
            disabled={busy !== null}
          >
            {busy === action ? LABELS[action][1] : LABELS[action][0]}
          </AdminButton>
        ))}
      </div>
      {error && (
        <p className={styles.error} role="alert">
          {error}
        </p>
      )}
      {result && (
        <div className={styles.ok} role="status">
          <p>{result.message}</p>
          {result.details?.map((line) => (
            <p key={line}>{line}</p>
          ))}
          {result.link && (
            <p>
              <a href={result.link} target="_blank" rel="noreferrer">
                Открыть лид в Битрикс24
              </a>
            </p>
          )}
        </div>
      )}
    </div>
  )
}
