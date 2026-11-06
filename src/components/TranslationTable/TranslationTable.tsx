'use client'

import { useState } from 'react'
import { AdminButton } from '@/components/AdminButton/AdminButton'
import { FileDrop } from '@/components/FileDrop/FileDrop'
import { readSpreadsheet, SpreadsheetError } from '@/domain/spreadsheet.mjs'
import {
  DOCS_PER_REQUEST,
  type IncomingRow,
  readTranslationRows,
  TRANSLATION_PROMPT,
} from '@/domain/translationTable.mjs'
import styles from './TranslationTable.module.css'

type Problem = { key: string; lang: 'kk' | 'en'; reason: string }
type Check = {
  docs: number
  texts: number
  unchanged: number
  problems: Problem[]
  problemCount: number
}

const API = '/api/admin/translations'
const LANG = { kk: 'казахский', en: 'английский' } as const

async function post(body: Record<string, unknown>) {
  const response = await fetch(API, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
  const result = await response.json().catch(() => ({}))
  if (!response.ok) throw new Error(result.error || 'Сервер не ответил. Повторите.')
  return result
}

/** Строки по товарам: документ целиком уходит в один запрос записи. */
function byDoc(rows: IncomingRow[]) {
  const groups = new Map<string, IncomingRow[]>()
  for (const row of rows) {
    const doc = row.key.split(':').slice(0, 2).join(':')
    groups.set(doc, [...(groups.get(doc) ?? []), row])
  }
  return [...groups.values()]
}

/**
 * Скачать часть для перевода и загрузить перевод обратно. Файл читается в браузере, на сервер
 * уходят только ключи и переводы; сначала проверка (что запишется, что пропущено), потом запись
 * по нескольку товаров за запрос.
 */
export function TranslationTable() {
  const [fileName, setFileName] = useState<string | null>(null)
  const [rows, setRows] = useState<IncomingRow[]>([])
  const [check, setCheck] = useState<Check | null>(null)
  const [busy, setBusy] = useState('')
  const [error, setError] = useState('')
  const [done, setDone] = useState('')
  const [copied, setCopied] = useState(false)

  async function copyPrompt() {
    try {
      await navigator.clipboard.writeText(TRANSLATION_PROMPT)
      setCopied(true)
      window.setTimeout(() => setCopied(false), 2000)
    } catch {
      setError('Браузер не дал скопировать. Выделите текст промпта и скопируйте вручную.')
    }
  }

  async function download(part: 'next' | 'all') {
    setError('')
    setDone('')
    setBusy(part === 'all' ? 'Готовим всю таблицу…' : 'Готовим часть…')
    try {
      const response = await fetch(`${API}?part=${part}`)
      if (!response.ok) {
        setError(await response.text())
        return
      }
      const name =
        /filename="([^"]+)"/.exec(response.headers.get('content-disposition') ?? '')?.[1] ??
        'perevody.xlsx'
      const link = document.createElement('a')
      link.href = URL.createObjectURL(await response.blob())
      link.download = name
      link.click()
      URL.revokeObjectURL(link.href)
    } catch {
      setError('Нет связи с сервером. Повторите.')
    } finally {
      setBusy('')
    }
  }

  async function read(file: File) {
    setError('')
    setDone('')
    setCheck(null)
    setRows([])
    setFileName(file.name)
    try {
      const found = readTranslationRows(
        await readSpreadsheet(new Uint8Array(await file.arrayBuffer())),
      )
      if (!found) {
        setError(
          'В файле нет таблицы переводов: первая колонка должна называться «Ключ», ' +
            'рядом колонки «Қазақша» и (или) «English».',
        )
        return
      }
      const filled = found.rows.filter((row) => row.kk || row.en)
      if (!filled.length) {
        setError('В таблице нет ни одного перевода: колонки «Қазақша» и «English» пустые.')
        return
      }
      setBusy('Проверяем…')
      setRows(filled)
      setCheck(await post({ action: 'check', rows: filled }))
    } catch (failure) {
      setError(
        failure instanceof SpreadsheetError || failure instanceof Error
          ? failure.message
          : 'Не удалось прочитать файл.',
      )
    } finally {
      setBusy('')
    }
  }

  async function save() {
    const groups = byDoc(rows)
    let saved = 0
    const failed: string[] = []
    setError('')
    try {
      for (let at = 0; at < groups.length; at += DOCS_PER_REQUEST) {
        setBusy(`Записываем… ${Math.min(at + DOCS_PER_REQUEST, groups.length)} из ${groups.length}`)
        const part = groups.slice(at, at + DOCS_PER_REQUEST).flat()
        const result = await post({ action: 'apply', rows: part })
        saved += Number(result.saved) || 0
        failed.push(...(Array.isArray(result.failed) ? result.failed : []))
      }
      setDone(
        `Записано переводов: ${saved}.` +
          (failed.length ? ` Не сохранились (повторите загрузку): ${failed.join(', ')}.` : ''),
      )
      setCheck(null)
      setRows([])
      setFileName(null)
    } catch (failure) {
      setError(
        `${failure instanceof Error ? failure.message : 'Ошибка.'} Записано до ошибки: ${saved}. ` +
          'Загрузите тот же файл ещё раз — уже записанное повторно не меняется.',
      )
    } finally {
      setBusy('')
    }
  }

  return (
    <section className={styles.root}>
      <div className={styles.block}>
        <h2 className={styles.title}>1. Скачать</h2>
        <div className={styles.actions}>
          <AdminButton onClick={() => download('next')} disabled={Boolean(busy)}>
            Скачать следующую часть
          </AdminButton>
          <AdminButton secondary onClick={() => download('all')} disabled={Boolean(busy)}>
            Вся таблица
          </AdminButton>
        </div>
        <p className={styles.hint}>
          Часть — около 12 000 знаков, столько ChatGPT переводит за раз без обрывов. В неё попадают
          товары, где не хватает хотя бы одного перевода. Вся таблица — для проверки и правки уже
          переведённого.
        </p>
      </div>

      <div className={styles.block}>
        <h2 className={styles.title}>2. Перевести в ChatGPT</h2>
        <p className={styles.hint}>
          Режим Thinking, время размышления обычное. Новый чат, файл и этот промпт одним сообщением;
          на каждые 2–3 части — новый чат.
        </p>
        <div className={styles.actions}>
          <AdminButton secondary onClick={copyPrompt}>
            {copied ? 'Скопировано' : 'Скопировать промпт'}
          </AdminButton>
        </div>
        <details>
          <summary>Показать промпт</summary>
          <pre className={styles.prompt}>{TRANSLATION_PROMPT}</pre>
        </details>
      </div>

      <div className={styles.block}>
        <h2 className={styles.title}>3. Загрузить перевод</h2>
        <FileDrop
          accept=".xlsx,.ods,.csv"
          fileName={fileName}
          onFile={read}
          what="таблицу с переводом"
        />
        <p className={styles.hint}>
          Пустые ячейки ничего не стирают. Чтобы исправить перевод, скачайте всю таблицу, поправьте
          ячейку и загрузите.
        </p>
      </div>

      {check && (
        <div className={styles.found}>
          <p>
            <strong>
              Запишется переводов: {check.texts} в {check.docs}{' '}
              {check.docs === 1 ? 'товаре или разделе' : 'товарах и разделах'}.
            </strong>
            {check.unchanged > 0 && ` Без изменений: ${check.unchanged}.`}
          </p>
          {check.problemCount > 0 && (
            <details open={check.texts === 0}>
              <summary>Пропущено: {check.problemCount}</summary>
              <ul className={styles.problems}>
                {check.problems.map((problem) => (
                  <li key={`${problem.key}:${problem.lang}`}>
                    {problem.key} ({LANG[problem.lang]}) — {problem.reason}
                  </li>
                ))}
              </ul>
              <p className={styles.hint}>
                Обычно это ChatGPT потерял тег, строку списка или изменил адрес ссылки. Такую ячейку
                можно перевести заново или поправить вручную в карточке товара.
              </p>
            </details>
          )}
          <div className={styles.actions}>
            <AdminButton onClick={save} disabled={Boolean(busy) || check.texts === 0}>
              Записать переводы
            </AdminButton>
          </div>
        </div>
      )}

      {busy && (
        <p className={styles.hint} role="status">
          {busy}
        </p>
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
