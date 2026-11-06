'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { AdminButton } from '@/components/AdminButton/AdminButton'
import { FileDrop } from '@/components/FileDrop/FileDrop'
import { readSpreadsheet, SpreadsheetError } from '@/domain/spreadsheet.mjs'
import { isTermKey, TERMS_PER_REQUEST } from '@/domain/terms.mjs'
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
  /** Строк словаря характеристик и комплектаций. */
  terms: number
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

/**
 * Запросы записи: строки товара целиком в одном запросе, по DOCS_PER_REQUEST товаров; строки
 * словаря — по TERMS_PER_REQUEST.
 */
function batches(rows: IncomingRow[]) {
  const groups = new Map<string, IncomingRow[]>()
  const terms: IncomingRow[] = []
  for (const row of rows) {
    if (isTermKey(row.key)) {
      terms.push(row)
      continue
    }
    const doc = row.key.split(':').slice(0, 2).join(':')
    groups.set(doc, [...(groups.get(doc) ?? []), row])
  }
  const docs = [...groups.values()]
  const result: IncomingRow[][] = []
  for (let at = 0; at < docs.length; at += DOCS_PER_REQUEST)
    result.push(docs.slice(at, at + DOCS_PER_REQUEST).flat())
  for (let at = 0; at < terms.length; at += TERMS_PER_REQUEST)
    result.push(terms.slice(at, at + TERMS_PER_REQUEST))
  return result
}

type TableSet = 'docs' | 'terms'
type Part = 'next' | 'big' | 'all'

/**
 * Скачать часть для перевода и загрузить перевод обратно. Файл читается в браузере, на сервер
 * уходят только ключи и переводы; сначала проверка (что запишется, что пропущено), потом запись
 * по нескольку товаров за запрос.
 */
export function TranslationTable() {
  const router = useRouter()
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

  async function download(part: Part, set: TableSet) {
    setError('')
    setDone('')
    setBusy(part === 'all' ? 'Готовим всю таблицу…' : 'Готовим часть…')
    try {
      const response = await fetch(`${API}?part=${part}${set === 'terms' ? '&set=terms' : ''}`)
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
    const parts = batches(rows)
    let saved = 0
    const failed: string[] = []
    setError('')
    try {
      for (const [index, part] of parts.entries()) {
        setBusy(`Записываем… ${index + 1} из ${parts.length}`)
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
      // Сводка вверху страницы считается на сервере: перечитать её после записи.
      router.refresh()
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
        <p className={styles.hint}>Тексты товаров и разделов</p>
        <div className={styles.actions}>
          <AdminButton onClick={() => download('next', 'docs')} disabled={Boolean(busy)}>
            Скачать следующую часть
          </AdminButton>
          <AdminButton secondary onClick={() => download('big', 'docs')} disabled={Boolean(busy)}>
            Большая часть (×15)
          </AdminButton>
          <AdminButton secondary onClick={() => download('all', 'docs')} disabled={Boolean(busy)}>
            Вся таблица
          </AdminButton>
        </div>
        <p className={styles.hint}>Характеристики и комплектации (общий словарь)</p>
        <div className={styles.actions}>
          <AdminButton onClick={() => download('next', 'terms')} disabled={Boolean(busy)}>
            Скачать следующую часть
          </AdminButton>
          <AdminButton secondary onClick={() => download('big', 'terms')} disabled={Boolean(busy)}>
            Большая часть (×15)
          </AdminButton>
          <AdminButton secondary onClick={() => download('all', 'terms')} disabled={Boolean(busy)}>
            Весь словарь
          </AdminButton>
        </div>
        <p className={styles.hint}>
          Часть — около 12 000 знаков, столько ChatGPT переводит за раз без обрывов. Большая часть —
          около 180 000 знаков, кругов в 15 раз меньше, но ChatGPT может перевести не всё: пропуски
          видно на проверке после загрузки, их доберёт следующая часть. Просите ChatGPT переводить
          файл целиком, по листу, и вернуть Excel. В части попадают товары, где не хватает хотя бы
          одного перевода. Вся таблица — для проверки и правки уже переведённого. Словарь — короткие
          подписи со страниц товаров (названия и значения характеристик, комплектации, условия
          лицензий, тексты подбора): каждый текст переводится один раз и подставляется во все
          товары, где он встречается. Отдельные строки можно поправить в{' '}
          <a href="/admin/collections/terms">«Словаре переводов»</a>.
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
              Запишется переводов: {check.texts}
              {check.docs > 0 &&
                ` в ${check.docs} ${check.docs === 1 ? 'товаре или разделе' : 'товарах и разделах'}`}
              {check.terms > 0 && `${check.docs > 0 ? ',' : ''} строк словаря: ${check.terms}`}.
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
