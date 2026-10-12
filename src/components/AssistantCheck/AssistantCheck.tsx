'use client'

import { useEffect, useRef, useState } from 'react'
import { AdminButton } from '@/components/AdminButton/AdminButton'
import { CHECK_LIMIT, CHECK_QUESTIONS, parseQuestions } from '@/domain/assistantCheck.mjs'
import { downloadText, toCsv } from '@/lib/bitrixImportClient'
import styles from './AssistantCheck.module.css'

type Flag = { level: 'warn' | 'info'; text: string }
type Row = {
  question: string
  reply?: string
  cards?: { title: string; href: string }[]
  calls?: string[]
  flags?: Flag[]
  ms?: number
  error?: string
}

/** Список вопросов запоминается в этом браузере, чтобы не вставлять его каждый раз. */
const STORAGE_KEY = 'cadkz-yuki-check-questions'

function readSaved() {
  try {
    return window.localStorage.getItem(STORAGE_KEY)
  } catch {
    return null
  }
}

function save(text: string) {
  try {
    window.localStorage.setItem(STORAGE_KEY, text)
  } catch {
    // Хранилище закрыто — список просто не запомнится.
  }
}

async function ask(question: string): Promise<Row> {
  try {
    const response = await fetch('/api/admin/assistant-check', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ question }),
    })
    const data = await response.json()
    if (!response.ok) return { question, error: data.error || `Ошибка ${response.status}` }
    return { question, ...data }
  } catch {
    return { question, error: 'Нет связи с сервером' }
  }
}

/**
 * Проверка Юки: вопросы по одному в строке → ответы по очереди, с обращениями к каталогу и ценам
 * и флагами «на что посмотреть». Отчёт скачивается таблицей для Excel.
 */
export function AssistantCheck() {
  const [text, setText] = useState(CHECK_QUESTIONS.join('\n'))
  const [rows, setRows] = useState<Row[]>([])
  const [busy, setBusy] = useState(false)
  const stop = useRef(false)

  useEffect(() => {
    const saved = readSaved()
    if (saved) setText(saved)
  }, [])

  const questions = parseQuestions(text)

  async function run() {
    save(text)
    stop.current = false
    setBusy(true)
    setRows([])
    for (const question of questions) {
      if (stop.current) break
      const row = await ask(question)
      setRows((list) => [...list, row])
    }
    setBusy(false)
  }

  function report() {
    const head = [
      'Вопрос',
      'Ответ Юки',
      'Ссылки под ответом',
      'Обращения к каталогу',
      'Флаги',
      'Секунд',
    ]
    const body = rows.map((row) => [
      row.question,
      row.error ? `Ошибка: ${row.error}` : (row.reply ?? ''),
      (row.cards ?? []).map((c) => c.title).join('; '),
      (row.calls ?? []).join('\n'),
      (row.flags ?? []).map((f) => f.text).join('\n'),
      row.ms ? (row.ms / 1000).toFixed(1) : '',
    ])
    downloadText('proverka-yuki.csv', toCsv([head, ...body]), 'text/csv')
  }

  const warnings = rows.filter((r) => r.error || r.flags?.some((f) => f.level === 'warn')).length

  return (
    <div className={styles.root}>
      <label className={styles.field}>
        <span>Вопросы клиентов — по одному в строке, до {CHECK_LIMIT}</span>
        <textarea
          className={styles.questions}
          value={text}
          rows={12}
          disabled={busy}
          onChange={(event) => setText(event.target.value)}
        />
      </label>
      <div className={styles.actions}>
        <AdminButton disabled={busy || !questions.length} onClick={run}>
          Проверить {questions.length} вопр.
        </AdminButton>
        {busy && (
          <AdminButton secondary onClick={() => (stop.current = true)}>
            Остановить
          </AdminButton>
        )}
        {!busy && rows.length > 0 && (
          <AdminButton secondary onClick={report}>
            Скачать отчёт (Excel)
          </AdminButton>
        )}
        <button
          type="button"
          className={styles.link}
          onClick={() => setText(CHECK_QUESTIONS.join('\n'))}
        >
          Вернуть стартовый список
        </button>
      </div>
      {rows.length > 0 && (
        <p className={styles.summary} aria-live="polite">
          {busy ? `Проверено ${rows.length} из ${questions.length}…` : `Проверено ${rows.length}.`}{' '}
          С флагами или ошибкой: {warnings}.
        </p>
      )}
      {rows.length > 0 && (
        <ol className={styles.list}>
          {rows.map((row) => (
            <li key={row.question} className={styles.item}>
              <p className={styles.question}>
                <strong>{row.question}</strong>
              </p>
              {row.error ? (
                <p className={styles.error}>{row.error}</p>
              ) : (
                <>
                  <p className={styles.reply}>{row.reply}</p>
                  {row.cards && row.cards.length > 0 && (
                    <p className={styles.meta}>
                      Под ответом: {row.cards.map((c) => c.title).join('; ')}
                    </p>
                  )}
                  {row.calls && row.calls.length > 0 && (
                    <details className={styles.meta}>
                      <summary>Обращения к каталогу и ценам: {row.calls.length}</summary>
                      <ul>
                        {row.calls.map((call) => (
                          <li key={call}>{call}</li>
                        ))}
                      </ul>
                    </details>
                  )}
                  {row.flags && row.flags.length > 0 && (
                    <ul className={styles.flags}>
                      {row.flags.map((flag) => (
                        <li
                          key={flag.text}
                          className={flag.level === 'warn' ? styles.warn : styles.info}
                        >
                          {flag.text}
                        </li>
                      ))}
                    </ul>
                  )}
                  {row.ms !== undefined && (
                    <p className={styles.meta}>{(row.ms / 1000).toFixed(1)} с</p>
                  )}
                </>
              )}
            </li>
          ))}
        </ol>
      )}
    </div>
  )
}
