'use client'

import { useState } from 'react'
import { AdminButton } from '@/components/AdminButton/AdminButton'
import { FileDrop } from '@/components/FileDrop/FileDrop'
import {
  type KnowledgeEntry,
  NEW_LICENSE,
  type PriceRow,
  parseKnowledge,
  parsePriceTable,
  type VatMode,
} from '@/domain/priceTable.mjs'
import { readSpreadsheet, SpreadsheetError } from '@/domain/spreadsheet.mjs'
import styles from './KaddiData.module.css'

type Parsed = {
  fileName: string
  price: { sheet: string; rows: PriceRow[]; problems: string[]; updated: string } | null
  knowledge: { sheet: string; entries: KnowledgeEntry[] } | null
}

const PROBLEMS_SHOWN = 12

function count(rows: PriceRow[], test: (row: PriceRow) => boolean) {
  return rows.filter(test).length.toLocaleString('ru-RU')
}

/**
 * Загрузка «Прайс CAD.kz» для Кадди: файл разбирается в браузере, на экране — что нашлось,
 * затем прайс и (или) база знаний уходят на сервер и заменяют прежние.
 */
export function KaddiData() {
  const [parsed, setParsed] = useState<Parsed | null>(null)
  const [vat, setVat] = useState<VatMode>('unknown')
  const [usePrice, setUsePrice] = useState(true)
  const [useKnowledge, setUseKnowledge] = useState(true)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [done, setDone] = useState('')

  async function read(file: File) {
    setError('')
    setDone('')
    setParsed(null)
    try {
      const sheets = await readSpreadsheet(new Uint8Array(await file.arrayBuffer()))
      const price = parsePriceTable(sheets)
      const knowledge = parseKnowledge(sheets)
      if (!price && !knowledge) {
        setError(
          'В файле нет листа прайса (заголовки «Код» и «Цена, тенге») и листа FAQ (колонка «Продукт»).',
        )
        return
      }
      setParsed({ fileName: file.name, price, knowledge })
      setUsePrice(Boolean(price?.rows.length))
      setUseKnowledge(Boolean(knowledge?.entries.length))
    } catch (failure) {
      setError(failure instanceof SpreadsheetError ? failure.message : 'Не удалось прочитать файл.')
    }
  }

  async function save() {
    if (!parsed) return
    setBusy(true)
    setError('')
    try {
      const response = await fetch('/api/admin/kaddi-data', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'apply',
          ...(usePrice && parsed.price
            ? {
                price: {
                  rows: parsed.price.rows,
                  vat,
                  fileName: parsed.fileName,
                  updated: parsed.price.updated,
                },
              }
            : {}),
          ...(useKnowledge && parsed.knowledge ? { knowledge: parsed.knowledge.entries } : {}),
        }),
      })
      const result = await response.json()
      if (!response.ok) setError(result.error || 'Не удалось сохранить')
      else {
        setDone(result.message)
        setParsed(null)
        // Обновить состояние вверху страницы.
        window.setTimeout(() => window.location.reload(), 1500)
      }
    } catch {
      setError('Нет связи с сервером. Повторите.')
    } finally {
      setBusy(false)
    }
  }

  const rows = parsed?.price?.rows ?? []

  return (
    <section className={styles.root}>
      <h2 className={styles.title}>Загрузить файл</h2>
      <FileDrop accept=".xlsx,.ods,.csv" fileName={parsed?.fileName ?? null} onFile={read} />
      {parsed && (
        <div className={styles.found}>
          {parsed.price ? (
            <div className={styles.block}>
              <label className={styles.check}>
                <input
                  type="checkbox"
                  checked={usePrice}
                  onChange={(e) => setUsePrice(e.target.checked)}
                />
                <strong>
                  Прайс (лист {parsed.price.sheet}): {rows.length.toLocaleString('ru-RU')} строк
                </strong>
              </label>
              <p className={styles.hint}>
                Дата прайса: {parsed.price.updated || 'не указана'}. Новых лицензий:{' '}
                {count(rows, (r) => r.purchase === NEW_LICENSE)}, с ценой:{' '}
                {count(rows, (r) => r.status === 'price')}, по запросу:{' '}
                {count(rows, (r) => r.status === 'request')}, без корректной цены:{' '}
                {count(rows, (r) => r.status === 'invalid')}.
              </p>
              <label className={styles.field}>
                <span>Цены в файле</span>
                <select value={vat} onChange={(e) => setVat(e.target.value as VatMode)}>
                  <option value="unknown">НДС не указан — Кадди скажет, что это уточняется</option>
                  <option value="included">с НДС</option>
                  <option value="excluded">без НДС</option>
                </select>
              </label>
              {parsed.price.problems.length > 0 && (
                <details>
                  <summary>Замечания по строкам: {parsed.price.problems.length}</summary>
                  <ul className={styles.problems}>
                    {parsed.price.problems.slice(0, PROBLEMS_SHOWN).map((problem) => (
                      <li key={problem}>{problem}</li>
                    ))}
                  </ul>
                </details>
              )}
            </div>
          ) : (
            <p className={styles.hint}>Листа прайса в файле нет — прайс останется прежним.</p>
          )}
          {parsed.knowledge ? (
            <div className={styles.block}>
              <label className={styles.check}>
                <input
                  type="checkbox"
                  checked={useKnowledge}
                  onChange={(e) => setUseKnowledge(e.target.checked)}
                />
                <strong>
                  База знаний (лист {parsed.knowledge.sheet}): {parsed.knowledge.entries.length}{' '}
                  записей
                </strong>
              </label>
              <p className={styles.hint}>
                Заменит всю базу знаний: правки, сделанные в админке, пропадут.
              </p>
            </div>
          ) : (
            <p className={styles.hint}>Листа FAQ в файле нет — база знаний останется прежней.</p>
          )}
          <div className={styles.actions}>
            <AdminButton
              onClick={save}
              disabled={
                busy || (!(usePrice && parsed.price) && !(useKnowledge && parsed.knowledge))
              }
            >
              {busy ? 'Сохраняем…' : 'Загрузить для Кадди'}
            </AdminButton>
          </div>
        </div>
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
