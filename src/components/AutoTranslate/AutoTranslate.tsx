'use client'

import { useRouter } from 'next/navigation'
import { useRef, useState } from 'react'
import { AdminButton } from '@/components/AdminButton/AdminButton'
import { AUTO_LANES } from '@/domain/autoTranslate.mjs'
import styles from './AutoTranslate.module.css'

const API = '/api/admin/translations/auto'
/** Перегрузка модели: подождать и повторить, не больше стольких раз подряд. */
const RETRIES = 5
const RETRY_PAUSE = 20_000

type TableSet = 'docs' | 'terms' | 'site'
type Problem = { key: string; lang: 'kk' | 'en'; reason: string }
type Step = {
  done?: boolean
  saved?: number
  chars?: number
  skip?: string[]
  problems?: Problem[]
  error?: string
  retry?: boolean
}
type Stats = { saved: number; chars: number; skipped: number }

const SETS: { set: TableSet; label: string }[] = [
  { set: 'site', label: 'тексты сайта (главная, BIM, контакты, страницы, новости)' },
  { set: 'docs', label: 'тексты товаров и разделов' },
  { set: 'terms', label: 'словарь характеристик и комплектаций' },
]

const wait = (ms: number) => new Promise((resolve) => window.setTimeout(resolve, ms))

/**
 * Автоперевод: браузер гоняет запросы к серверу несколькими дорожками, сервер переводит
 * моделью и записывает. Закрыли вкладку — следующий запуск продолжит с непереведённого.
 */
export function AutoTranslate() {
  const router = useRouter()
  const stop = useRef(false)
  const [running, setRunning] = useState('')
  const [stats, setStats] = useState<Stats>({ saved: 0, chars: 0, skipped: 0 })
  const [problems, setProblems] = useState<Problem[]>([])
  const [error, setError] = useState('')
  const [done, setDone] = useState('')

  async function step(body: Record<string, unknown>): Promise<Step> {
    for (let attempt = 0; ; attempt++) {
      let result: Step = { error: 'Нет связи с сервером.', retry: true }
      try {
        const response = await fetch(API, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        })
        result = await response.json().catch(() => ({ error: 'Сервер не ответил.', retry: true }))
        if (response.ok) return result
        if (response.status === 504) result = { error: 'Сервер не успел.', retry: true }
      } catch {
        // Сеть: повторим.
      }
      if (!result.retry || attempt >= RETRIES || stop.current) return result
      await wait(RETRY_PAUSE)
    }
  }

  async function lane(set: TableSet, index: number, skip: Set<string>) {
    while (!stop.current) {
      const result = await step({ set, lane: index, lanes: AUTO_LANES, skip: [...skip] })
      if (result.error) throw new Error(result.error)
      if (result.done) return
      for (const key of result.skip ?? []) skip.add(key)
      setStats((now) => ({
        saved: now.saved + (result.saved ?? 0),
        chars: now.chars + (result.chars ?? 0),
        skipped: now.skipped + (result.skip?.length ?? 0),
      }))
      if (result.problems?.length)
        setProblems((now) => [...now, ...(result.problems ?? [])].slice(-50))
    }
  }

  async function start() {
    stop.current = false
    setError('')
    setDone('')
    setProblems([])
    setStats({ saved: 0, chars: 0, skipped: 0 })
    try {
      for (const { set, label } of SETS) {
        if (stop.current) break
        setRunning(`Переводим ${label}…`)
        const skip = new Set<string>()
        await Promise.all(Array.from({ length: AUTO_LANES }, (_, index) => lane(set, index, skip)))
      }
      setDone(stop.current ? 'Остановлено. Запустите снова — продолжит с места.' : 'Готово.')
    } catch (failure) {
      stop.current = true
      setError(
        `${failure instanceof Error ? failure.message : 'Ошибка.'} Уже переведённое сохранено — ` +
          'запустите снова, продолжит с места.',
      )
    } finally {
      setRunning('')
      router.refresh()
    }
  }

  return (
    <section className={styles.root}>
      <h2 className={styles.title}>Автоматический перевод</h2>
      <p className={styles.hint}>
        Сайт сам переводит всё, что ещё не переведено, моделью Claude (ключ компании, тот же, что у
        Кадди), проверяет разметку и сразу сохраняет: сначала тексты сайта (главная, BIM, контакты и
        подвал, страницы, новости — свежие первыми), затем товары и разделы, затем словарь. Длинные
        статьи переводятся частями и появляются на сайте, когда готовы все части. Держите вкладку
        открытой; закрыли или прервалось — нажмите снова, продолжит с места. Уже переведённое не
        трогается. Строки, которые модель перевела с ошибкой разметки, пропускаются — их можно
        перевести таблицей ниже или вручную.
      </p>
      <div className={styles.actions}>
        <AdminButton onClick={start} disabled={Boolean(running)}>
          Перевести всё автоматически
        </AdminButton>
        {running && (
          <AdminButton
            secondary
            onClick={() => {
              stop.current = true
              setRunning('Останавливаем после текущих запросов…')
            }}
          >
            Остановить
          </AdminButton>
        )}
      </div>
      {(running || stats.saved > 0) && (
        <p className={styles.hint} role="status">
          {running} Записано переводов: {stats.saved}, обработано около{' '}
          {stats.chars.toLocaleString('ru-RU')} знаков
          {stats.skipped > 0 && `, пропущено строк: ${stats.skipped}`}.
        </p>
      )}
      {problems.length > 0 && (
        <details>
          <summary>Пропущенные строки</summary>
          <ul className={styles.problems}>
            {problems.map((problem) => (
              <li key={`${problem.key}:${problem.lang}`}>
                {problem.key} ({problem.lang}) — {problem.reason}
              </li>
            ))}
          </ul>
        </details>
      )}
      {error && (
        <p className={styles.error} role="alert">
          {error}
        </p>
      )}
      {done && (
        <p className={styles.done} role="status">
          {done}
        </p>
      )}
    </section>
  )
}
