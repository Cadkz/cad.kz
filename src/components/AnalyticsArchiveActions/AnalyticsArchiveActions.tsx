'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { AdminButton } from '@/components/AdminButton/AdminButton'
import { adminCall } from '@/lib/adminCall'
import styles from './AnalyticsArchiveActions.module.css'

type Props = {
  /** Почта настроена — кнопка отправки работает. */
  canSend: boolean
  /** Адрес скачивания архива за период, который уйдёт следующим. */
  download: string
  period: string
}

type Result = { message: string; details?: string[] }

/** Кнопки блока «Архив на почту»: отправить сейчас и скачать; итог текстом под кнопками. */
export function AnalyticsArchiveActions({ canSend, download, period }: Props) {
  const router = useRouter()
  const [busy, setBusy] = useState(false)
  const [result, setResult] = useState<Result | null>(null)
  const [error, setError] = useState('')

  async function send() {
    setBusy(true)
    setResult(null)
    setError('')
    try {
      setResult(await adminCall<Result>('/api/admin/analytics/archive', { action: 'send' }))
      router.refresh()
    } catch (failure) {
      setError(failure instanceof Error ? failure.message : 'Не получилось. Повторите.')
      router.refresh()
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className={styles.root}>
      <div className={styles.actions}>
        <AdminButton onClick={send} disabled={busy || !canSend}>
          {busy ? 'Собираю и отправляю…' : 'Отправить архив сейчас'}
        </AdminButton>
        <a className={styles.link} href={download} download>
          Скачать архив за {period}
        </a>
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
        </div>
      )}
    </div>
  )
}
