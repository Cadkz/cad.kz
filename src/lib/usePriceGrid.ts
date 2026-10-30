'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import type { TreeGroup } from '@/domain/adminCatalog.mjs'
import { countByGroup, filterPriceRows, parseAmount, priceFolders } from '@/domain/priceEdit.mjs'
import { adminCall } from './adminCall'
import { formatAmount } from './format'
import type { PriceGridRow } from './offerPrices'
import { type PricePlace, pushPricePlace, readPricePlace } from './priceUrl'

/**
 * «Цены таблицей»: правки живут здесь, в браузере, до нажатия «Применить». Цену в тенге после
 * правки считает сервер (src/lib/offerPrices.ts) — через полсекунды после ввода.
 */

const API = '/api/admin/offer-prices'
export const PAGE = 100

type Currency = PriceGridRow['currency']

/** Папка во вкладке: производитель, «Без производителя» или список папок (null). */
export type PriceFolder = number | 'none' | null

export type PriceFilter = {
  query: string
  /** Вкладка, как в «Каталоге» (пожелание владельца 30.10.2026): ПО, оборудование, услуги. */
  group: TreeGroup
  vendor: PriceFolder
  section: number | null
  currency: string
  status: 'all' | 'published' | 'draft'
  noPrice: boolean
  onlyEdited: boolean
}

const EMPTY: PriceFilter = {
  query: '',
  group: 'software',
  vendor: null,
  section: null,
  currency: '',
  status: 'all',
  noPrice: false,
  onlyEdited: false,
}

export type Draft = { text: string; currency: Currency }
export type Quote = {
  oldKzt: string | null
  newKzt: string | null
  change: { percent: number | null; text: string; big: boolean } | null
  noRate?: boolean
  missing?: boolean
}
export type Edit = { row: PriceGridRow; amount: string | null; currency: Currency }
type Message = { kind: 'ok' | 'error'; text: string }

/** query — начальный поиск, например название товара из ссылки «Цены таблицей» в карточке товара. */
/** Фильтры, кроме вкладки и папки: при любом из них папки не нужны — сразу таблица. */
export function isFiltering(filter: PriceFilter) {
  return Boolean(
    filter.query.trim() ||
      filter.section != null ||
      filter.currency ||
      filter.status !== 'all' ||
      filter.noPrice ||
      filter.onlyEdited,
  )
}

export function usePriceGrid(
  initial: PriceGridRow[],
  vendors: { id: number; title: string }[],
  query = '',
) {
  const [rows, setRows] = useState(initial)
  const [filter, setFilterState] = useState<PriceFilter>(() => ({ ...EMPTY, query }))
  const [limit, setLimit] = useState(PAGE)
  const [drafts, setDrafts] = useState<Map<number, Draft>>(() => new Map())
  const [quotes, setQuotes] = useState<Map<number, Quote>>(() => new Map())
  const [reviewing, setReviewing] = useState(false)
  const [confirmBig, setConfirmBig] = useState(false)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState<Message | null>(null)
  const request = useRef(0)

  const byId = useMemo(() => new Map(rows.map((row) => [row.id, row])), [rows])
  const edits = useMemo(
    () =>
      [...drafts].flatMap(([id, draft]): Edit[] => {
        const row = byId.get(id)
        return row ? [{ row, amount: parseAmount(draft.text), currency: draft.currency }] : []
      }),
    [drafts, byId],
  )
  const valid = edits.filter((edit) => edit.amount !== null)
  const key = valid.map((edit) => `${edit.row.id}:${edit.amount}:${edit.currency}`).join('|')

  // Пересчёт правок в тенге на сервере: после паузы в наборе, последний ответ побеждает.
  useEffect(() => {
    if (!key) return setQuotes(new Map())
    const items = key.split('|').map((part) => {
      const [offerId, amount, currency] = part.split(':')
      return { offerId: Number(offerId), amount, currency }
    })
    const ticket = ++request.current
    const timer = setTimeout(async () => {
      try {
        const reply = await adminCall<{ rows: (Quote & { offerId: number })[] }>(API, {
          action: 'preview',
          items,
        })
        if (ticket === request.current)
          setQuotes(new Map(reply.rows.map((quote) => [quote.offerId, quote])))
      } catch (error) {
        if (ticket === request.current)
          setMessage({ kind: 'error', text: error instanceof Error ? error.message : '' })
      }
    }, 400)
    return () => clearTimeout(timer)
  }, [key])

  // Вкладка и папка — из адреса при открытии и по «Назад» в браузере.
  useEffect(() => {
    const read = () => {
      setFilterState((current) => ({
        ...current,
        ...readPricePlace(window.location.search, initial, current.query),
      }))
      setLimit(PAGE)
    }
    read()
    window.addEventListener('popstate', read)
    return () => window.removeEventListener('popstate', read)
  }, [initial])

  // Неприменённые правки не теряются молча при уходе со страницы.
  useEffect(() => {
    if (!drafts.size) return
    const warn = (event: BeforeUnloadEvent) => event.preventDefault()
    window.addEventListener('beforeunload', warn)
    return () => window.removeEventListener('beforeunload', warn)
  }, [drafts.size])

  const edited = useMemo(
    () => (filter.onlyEdited ? new Set(drafts.keys()) : null),
    [filter.onlyEdited, drafts],
  )
  const visible = useMemo(
    () => filterPriceRows(rows, { ...filter, edited }),
    [rows, filter, edited],
  )

  // Папки производителей вкладки — пока не открыта папка и не включён ни один фильтр.
  const showFolders = filter.vendor === null && !isFiltering(filter)
  const titles = useMemo(
    () => new Map(vendors.map((vendor) => [vendor.id, vendor.title])),
    [vendors],
  )
  const folders = useMemo(
    () => priceFolders(filterPriceRows(rows, { group: filter.group }), titles),
    [rows, filter.group, titles],
  )
  // Что нашлось поиском в других вкладках: «ещё в Оборудовании — 3».
  const elsewhere = useMemo(() => {
    if (!filter.query.trim()) return {}
    const counts = countByGroup(
      filterPriceRows(rows, { ...filter, group: null, vendor: null, edited }),
    )
    delete counts[filter.group]
    return counts
  }, [rows, filter, edited])

  function setDraft(row: PriceGridRow, draft: Draft) {
    setMessage(null)
    setReviewing(false)
    setDrafts((current) => {
      const next = new Map(current)
      const same = parseAmount(draft.text) === row.amount && draft.currency === row.currency
      if (same) next.delete(row.id)
      else next.set(row.id, draft)
      return next
    })
  }

  const draftOf = (row: PriceGridRow): Draft =>
    drafts.get(row.id) ?? { text: formatAmount(row.amount), currency: row.currency }

  const quoted = valid.map((edit) => ({ ...edit, quote: quotes.get(edit.row.id) }))
  const ready = valid.length > 0 && valid.length === edits.length && quoted.every((e) => e.quote)
  const big = quoted.filter((edit) => edit.quote?.change?.big).length

  async function apply() {
    setSaving(true)
    setMessage(null)
    try {
      const reply = await adminCall<{
        saved: { id: number; amount: string; currency: Currency; kzt: string | null }[]
        conflicts: number[]
      }>(API, {
        action: 'apply',
        confirmBig,
        items: valid.map(({ row, amount, currency }) => ({
          offerId: row.id,
          amount,
          currency,
          was: row.amount,
          wasCurrency: row.currency,
        })),
      })
      const saved = new Map(reply.saved.map((item) => [item.id, item]))
      setRows((current) =>
        current.map((row) => {
          const item = saved.get(row.id)
          return item ? { ...row, ...item, noPrice: !item.kzt || item.kzt === '0' } : row
        }),
      )
      setDrafts((current) => {
        const next = new Map(current)
        for (const id of saved.keys()) next.delete(id)
        return next
      })
      setReviewing(false)
      setConfirmBig(false)
      const conflicts = reply.conflicts.length
      setMessage({
        kind: conflicts ? 'error' : 'ok',
        text:
          `Записано цен: ${reply.saved.length}.` +
          (conflicts
            ? ` Не записано ${conflicts}: эти цены уже поменял кто-то другой или загрузка прайса. Обновите страницу и проверьте их.`
            : ' Сайт уже показывает новые цены.'),
      })
    } catch (error) {
      setMessage({ kind: 'error', text: error instanceof Error ? error.message : '' })
    } finally {
      setSaving(false)
    }
  }

  return {
    filter,
    setFilter(patch: Partial<PriceFilter>) {
      setFilterState((current) => ({ ...current, ...patch }))
      setLimit(PAGE)
    },
    resetFilter: () =>
      setFilterState((current) => ({ ...EMPTY, group: current.group, vendor: current.vendor })),
    /** Открыть вкладку или папку: новый шаг в истории браузера, поиск и фильтры сохраняются. */
    go(place: PricePlace) {
      pushPricePlace(place)
      setFilterState((current) => ({ ...current, ...place }))
      setLimit(PAGE)
    },
    showFolders,
    folders,
    elsewhere,
    folderTitle: (folder: PriceFolder) =>
      folder === 'none' ? 'Без производителя' : folder === null ? '' : (titles.get(folder) ?? ''),
    total: rows.length,
    visible,
    shown: visible.slice(0, limit),
    showMore: () => setLimit((current) => current + PAGE),
    draftOf,
    isEdited: (row: PriceGridRow) => drafts.has(row.id),
    isInvalid: (row: PriceGridRow) =>
      drafts.has(row.id) && edits.some((e) => e.row.id === row.id && e.amount === null),
    quoteOf: (row: PriceGridRow) => (drafts.has(row.id) ? quotes.get(row.id) : undefined),
    setAmount: (row: PriceGridRow, text: string) => setDraft(row, { ...draftOf(row), text }),
    setCurrency: (row: PriceGridRow, currency: Currency) =>
      setDraft(row, { ...draftOf(row), currency }),
    undo: (row: PriceGridRow) => setDraft(row, { text: row.amount, currency: row.currency }),
    undoAll() {
      setDrafts(new Map())
      setReviewing(false)
      setConfirmBig(false)
    },
    edits,
    quoted,
    invalid: edits.length - valid.length,
    ready,
    big,
    reviewing,
    review: () => setReviewing(true),
    closeReview: () => setReviewing(false),
    confirmBig,
    setConfirmBig,
    saving,
    apply,
    message,
  }
}

export type PriceGridState = ReturnType<typeof usePriceGrid>
