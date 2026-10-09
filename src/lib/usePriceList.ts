'use client'

import { useState } from 'react'
import {
  type Columns,
  guessColumns,
  type PriceSet,
  priceRows,
  priceSets,
} from '@/domain/priceList.mjs'
import { readSpreadsheet, type Sheet, SpreadsheetError } from '@/domain/spreadsheet.mjs'

/** Производитель для выбора «Чей прайс» и его обычные валюта и НДС. */
export type PriceVendor = {
  id: number
  title: string
  offers: number
  currency: string
  includesVat: boolean
  sourceVat: string
}

export type Settings = {
  vendor: number | null
  currency: string
  includesVat: boolean
  sourceVat: string
}

export type MatchRow = {
  index: number
  name: string
  price: string | null
  offerId: number | null
  status: 'id' | 'saved' | 'auto' | 'check' | 'none' | 'noPrice' | 'manual'
  score: number
  oldAmount: string | null
  oldKzt: string | null
  newKzt: string | null
  /** Записывать эту строку. */
  use: boolean
}

export type Preview = {
  rows: MatchRow[]
  offers: { id: number; label: string }[]
  rate: string | null
}

async function call<T>(body: Record<string, unknown>): Promise<T> {
  const response = await fetch('/api/admin/price-list', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    credentials: 'same-origin',
    body: JSON.stringify(body),
  })
  const data = (await response.json().catch(() => ({}))) as T & { error?: string }
  if (!response.ok) throw new Error(data.error ?? 'Сервер не ответил. Повторите.')
  return data
}

/** Строка уверенно найдена: её можно записывать сразу. */
const sure = (row: Pick<MatchRow, 'status'>) => ['id', 'saved', 'auto'].includes(row.status)

/**
 * Загрузка прайса на странице админки: файл читается здесь же, в браузере, на сервер уходят
 * только название, ID и цена каждой строки. Проверка и запись — src/lib/priceListRun.ts.
 */
export function usePriceList(vendors: PriceVendor[]) {
  const first = vendors[0]
  const [settings, setSettings] = useState<Settings>({
    vendor: first?.id ?? null,
    currency: first?.currency ?? 'KZT',
    includesVat: first?.includesVat ?? false,
    sourceVat: first?.sourceVat ?? '16',
  })
  const [file, setFile] = useState<{ name: string; sheets: Sheet[] } | null>(null)
  const [sheet, setSheet] = useState(0)
  const [columns, setColumns] = useState<Columns | null>(null)
  const [preview, setPreview] = useState<Preview | null>(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [done, setDone] = useState<string | null>(null)

  const rows = file?.sheets[sheet]?.rows ?? []
  const sets: PriceSet[] = columns ? priceSets(rows, columns) : []

  /** Валюта и НДС для набора цен: «Цена в тг. с НДС» — тенге с НДС, иначе как у производителя. */
  function settingsFor(set: PriceSet, base: Settings): Settings {
    if (set.kzt)
      return { ...base, currency: 'KZT', includesVat: /ндс/i.test(set.title), sourceVat: '16' }
    const vendor = vendors.find((v) => v.id === base.vendor)
    return vendor
      ? {
          ...base,
          currency: vendor.currency,
          includesVat: vendor.includesVat,
          sourceVat: vendor.sourceVat,
        }
      : base
  }

  /**
   * Колонки по листу. Если цен два набора (тенге с НДС и евро), по умолчанию — тот, что в валюте
   * нынешних цен производителя на сайте: так цены остаются привязаны к тем же курсам.
   */
  function setupColumns(sheetRows: string[][]) {
    const guessed = guessColumns(sheetRows)
    const found = priceSets(sheetRows, guessed)
    const vendor = vendors.find((v) => v.id === settings.vendor)
    const preferred =
      found.find((set) => (vendor?.currency === 'KZT') === set.kzt) ?? found[0] ?? null
    setColumns(preferred ? { ...guessed, prices: preferred.prices } : guessed)
    if (preferred && found.length > 1) setSettings(settingsFor(preferred, settings))
  }

  function chooseSet(index: number) {
    const set = sets[index]
    if (!set || !columns) return
    setColumns({ ...columns, prices: set.prices })
    setSettings(settingsFor(set, settings))
    setPreview(null)
  }

  function chooseVendor(id: number | null) {
    const vendor = vendors.find((v) => v.id === id)
    setSettings({
      vendor: id,
      currency: vendor?.currency ?? settings.currency,
      includesVat: vendor?.includesVat ?? settings.includesVat,
      sourceVat: vendor?.sourceVat ?? settings.sourceVat,
    })
    setPreview(null)
  }

  async function chooseFile(picked: File) {
    setError(null)
    setDone(null)
    setPreview(null)
    try {
      const sheets = await readSpreadsheet(new Uint8Array(await picked.arrayBuffer()))
      // Актуальный лист прайса — первый (в прайсе SCAD остальные — история по старым курсам).
      setFile({ name: picked.name, sheets })
      setSheet(0)
      setupColumns(sheets[0]?.rows ?? [])
    } catch (problem) {
      setFile(null)
      setError(
        problem instanceof SpreadsheetError
          ? problem.message
          : 'Не получилось прочитать файл. Сохраните его в Excel как .xlsx и выберите снова.',
      )
    }
  }

  function chooseSheet(index: number) {
    setSheet(index)
    setupColumns(file?.sheets[index]?.rows ?? [])
    setPreview(null)
  }

  async function check() {
    if (!columns) return
    setBusy(true)
    setError(null)
    setDone(null)
    try {
      const data = await call<Omit<Preview, 'rows'> & { rows: Omit<MatchRow, 'use'>[] }>({
        action: 'preview',
        ...settings,
        rows: priceRows(rows, columns),
      })
      setPreview({
        ...data,
        rows: data.rows.map((row) => ({
          ...row,
          use: sure(row) && row.newKzt !== null && row.newKzt !== row.oldKzt,
        })),
      })
    } catch (problem) {
      setError(problem instanceof Error ? problem.message : String(problem))
    } finally {
      setBusy(false)
    }
  }

  const update = (index: number, change: Partial<MatchRow>) =>
    setPreview(
      (current) =>
        current && {
          ...current,
          rows: current.rows.map((row) => (row.index === index ? { ...row, ...change } : row)),
        },
    )

  /** Менеджер выбрал предложение сам: пересчитать цены строки на сервере. */
  async function pick(index: number, offerId: number | null) {
    const row = preview?.rows.find((r) => r.index === index)
    if (!row) return
    const empty = { oldAmount: null, oldKzt: null, newKzt: null }
    update(index, {
      offerId,
      status: 'manual',
      use: offerId !== null && row.price !== null,
      ...empty,
    })
    if (offerId === null || row.price === null) return
    try {
      const data = await call<Pick<MatchRow, 'oldAmount' | 'oldKzt' | 'newKzt'>>({
        action: 'quote',
        ...settings,
        offerId,
        price: row.price,
      })
      update(index, data)
    } catch (problem) {
      setError(problem instanceof Error ? problem.message : String(problem))
    }
  }

  async function apply() {
    const chosen = preview?.rows.filter((row) => row.use && row.offerId !== null && row.price)
    if (!chosen?.length) return
    setBusy(true)
    setError(null)
    try {
      const result = await call<{ changed: number; same: number; missing: number }>({
        action: 'apply',
        ...settings,
        fileName: file?.name,
        items: chosen.map((row) => ({ offerId: row.offerId, amount: row.price, name: row.name })),
      })
      setDone(
        `Записано: цена изменилась у ${result.changed}, без изменений ${result.same}` +
          (result.missing ? `, не найдено ${result.missing}` : '') +
          '. Цены на сайте уже новые.',
      )
      setPreview(null)
    } catch (problem) {
      setError(problem instanceof Error ? problem.message : String(problem))
    } finally {
      setBusy(false)
    }
  }

  return {
    settings,
    setSettings: (change: Partial<Settings>) => {
      setSettings({ ...settings, ...change })
      setPreview(null)
    },
    chooseVendor,
    file,
    sheet,
    chooseSheet,
    chooseFile,
    rows,
    columns,
    sets,
    chooseSet,
    setColumns: (next: Columns) => {
      setColumns(next)
      setPreview(null)
    },
    preview,
    update,
    pick,
    check,
    apply,
    busy,
    error,
    done,
  }
}

/** Текущие цены производителя файлом CSV (Excel его открывает): с ID для точной обратной загрузки. */
export async function downloadCurrent(vendor: number | null, title: string) {
  const data = await call<{
    rows: { id: number; label: string; amount: string; currency: string; includesVat: boolean }[]
  }>({ action: 'current', vendor })
  const cell = (value: string | number) => `"${String(value).replace(/"/g, '""')}"`
  const lines = [
    ['ID', 'Наименование', 'Цена', 'Валюта', 'НДС включён'].map(cell).join(';'),
    ...data.rows.map((row) =>
      [
        row.id,
        row.label,
        row.amount.replace('.', ','),
        row.currency,
        row.includesVat ? 'да' : 'нет',
      ]
        .map(cell)
        .join(';'),
    ),
  ]
  const blob = new Blob([`﻿${lines.join('\r\n')}`], { type: 'text/csv;charset=utf-8' })
  const link = document.createElement('a')
  link.href = URL.createObjectURL(blob)
  link.download = `Цены ${title}.csv`
  link.click()
  URL.revokeObjectURL(link.href)
}
