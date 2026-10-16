'use client'

import { useEffect, useRef, useState } from 'react'
import { AdminButton } from '@/components/AdminButton/AdminButton'
import {
  CHECK_LIMIT,
  CHECK_QUESTIONS,
  parseQuestions,
  splitChain,
} from '@/domain/assistantCheck.mjs'
import { downloadText, toCsv } from '@/lib/bitrixImportClient'
import styles from './AssistantCheck.module.css'

type Flag = { level: 'warn' | 'info'; text: string }
type Row = {
  question: string
  /** Шаг разговора из строки «вопрос → ответ клиента → …»: «2 из 3». */
  step?: string
  reply?: string
  cards?: { title: string; href: string }[]
  calls?: string[]
  flags?: Flag[]
  ms?: number
  error?: string
}

/** Список вопросов запоминается в этом браузере, чтобы не вставлять его каждый раз. */
const STORAGE_KEY = 'cadkz-kaddi-check-questions'

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

type Turn = { question: string; reply: string }

async function askOnce(question: string, history: Turn[]): Promise<Row & { retry?: true }> {
  let response: Response
  try {
    response = await fetch('/api/admin/assistant-check', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ question, history }),
    })
  } catch {
    return { question, error: 'Нет связи с сервером', retry: true }
  }
  let data: { error?: string }
  try {
    data = await response.json()
  } catch {
    // Вместо ответа — страница ошибки хостинга (обычно сервер не уложился во время).
    return { question, error: `Сервер не ответил (код ${response.status})`, retry: true }
  }
  if (!response.ok) return { question, error: data.error || `Ошибка ${response.status}` }
  return { question, ...data }
}

/** Сбой связи или хостинга — ещё одна попытка через пару секунд, ошибки модели — сразу в отчёт. */
async function ask(question: string, history: Turn[]): Promise<Row> {
  const first = await askOnce(question, history)
  if (!first.retry) return first
  await new Promise((resolve) => setTimeout(resolve, 2000))
  const { retry: _, ...second } = await askOnce(question, history)
  return second
}

/**
 * Проверка Кадди: вопросы по одному в строке → ответы по очереди, с обращениями к каталогу и ценам
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
  const steps = questions.reduce((sum, line) => sum + splitChain(line).length, 0)

  async function run() {
    save(text)
    stop.current = false
    setBusy(true)
    setRows([])
    for (const line of questions) {
      // Строка с «→» — разговор: Кадди отвечает на каждую реплику, помня предыдущие.
      const parts = splitChain(line)
      const history: Turn[] = []
      for (const [index, question] of parts.entries()) {
        if (stop.current) break
        const step = parts.length > 1 ? `${index + 1} из ${parts.length}` : undefined
        const row = { ...(await ask(question, history)), step }
        setRows((list) => [...list, row])
        if (row.error || row.reply === undefined) break
        history.push({ question, reply: row.reply })
      }
      if (stop.current) break
    }
    setBusy(false)
  }

  function report() {
    const head = [
      'Вопрос',
      'Шаг разговора',
      'Ответ Кадди',
      'Ссылки под ответом',
      'Обращения к каталогу',
      'Флаги',
      'Секунд',
    ]
    const body = rows.map((row) => [
      row.question,
      row.step ?? '',
      row.error ? `Ошибка: ${row.error}` : (row.reply ?? ''),
      (row.cards ?? []).map((c) => `${c.title} (${c.href})`).join('; '),
      (row.calls ?? []).join('\n'),
      (row.flags ?? []).map((f) => f.text).join('\n'),
      row.ms ? (row.ms / 1000).toFixed(1) : '',
    ])
    downloadText('proverka-kaddi.csv', toCsv([head, ...body]), 'text/csv')
  }

  const warnings = rows.filter((r) => r.error || r.flags?.some((f) => f.level === 'warn')).length

  return (
    <div className={styles.root}>
      <label className={styles.field}>
        <span>
          Вопросы клиентов — по одному в строке, до {CHECK_LIMIT}. Разговор в несколько шагов — в
          одной строке через «→»: «Нужна программа для оснований → Обычные откосы»
        </span>
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
          Проверить {questions.length} вопр.{steps > questions.length ? ` (${steps} шагов)` : ''}
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
          {busy ? `Проверено ${rows.length} из ${steps}…` : `Проверено ${rows.length}.`} С флагами
          или ошибкой: {warnings}.
        </p>
      )}
      {rows.length > 0 && (
        <ol className={styles.list}>
          {rows.map((row, index) => (
            // biome-ignore lint/suspicious/noArrayIndexKey: список только дополняется, порядок не меняется
            <li key={index} className={styles.item}>
              <p className={styles.question}>
                {row.step && <span className={styles.step}>Шаг {row.step} · </span>}
                <strong>{row.question}</strong>
              </p>
              {row.error ? (
                <p className={styles.error}>{row.error}</p>
              ) : (
                <>
                  <p className={styles.reply}>{row.reply}</p>
                  {row.cards && row.cards.length > 0 && (
                    <p className={styles.meta}>
                      Под ответом:{' '}
                      {row.cards.map((card, n) => (
                        <span key={card.href}>
                          {n > 0 && '; '}
                          <a href={card.href} target="_blank" rel="noreferrer">
                            {card.title}
                          </a>
                        </span>
                      ))}
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
