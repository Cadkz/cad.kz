'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { compareBy, type TreeGroup } from '@/domain/adminCatalog.mjs'
import type { CatalogTreeData, TreeProduct, TreeVendor } from './adminCatalog'

/** Папка внутри вкладки: производитель, «Без производителя» или список производителей. */
export type Folder = number | 'none' | null
export type SortState = { key: string; dir: 'asc' | 'desc' }
export type VendorRow = Omit<TreeVendor, 'counts'> & { count: number }
export type TreeEdit = {
  collection: 'products' | 'manufacturers'
  id: number
  title: string
  field: 'order' | 'published'
  value: number | boolean | null
  was: number | boolean | null
}
type Message = { kind: 'ok' | 'error'; text: string; undo?: TreeEdit }

const DEFAULT_SORT: SortState = { key: 'order', dir: 'asc' }
const GROUPS: TreeGroup[] = ['software', 'hardware', 'service']

/** Вкладка и папка из адреса: «Назад» в браузере возвращает на шаг назад, ссылку можно отправить. */
function fromUrl(): { group: TreeGroup; folder: Folder } {
  const params = new URLSearchParams(window.location.search)
  const group = GROUPS.find((value) => value === params.get('group')) ?? 'software'
  const raw = params.get('vendor')
  const folder: Folder = raw === 'none' ? 'none' : raw && /^\d+$/.test(raw) ? Number(raw) : null
  return { group, folder }
}

async function send(edit: TreeEdit) {
  const response = await fetch('/api/admin/catalog-tree', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    credentials: 'same-origin',
    body: JSON.stringify(edit),
  })
  const data = (await response.json().catch(() => ({}))) as {
    error?: string
    conflict?: boolean
    value?: number | boolean | null
    updatedAt?: string
  }
  if (!response.ok) throw new Error(data.error ?? 'Сервер не ответил. Повторите.')
  return data
}

const fieldName = (edit: TreeEdit) =>
  edit.field === 'order'
    ? `«Сорт.» ${edit.value ?? 'пусто'}`
    : edit.value
      ? 'активен, на сайте'
      : 'не активен, скрыт с сайта'

/** Состояние страницы «Каталог» в админке. */
export function useCatalogTree(data: CatalogTreeData) {
  const [vendors, setVendors] = useState(data.vendors)
  const [products, setProducts] = useState(data.products)
  const [group, setGroup] = useState<TreeGroup>('software')
  const [folder, setFolder] = useState<Folder>(null)
  const [query, setQuery] = useState('')
  const [vendorSort, setVendorSort] = useState<SortState>(DEFAULT_SORT)
  const [productSort, setProductSort] = useState<SortState>(DEFAULT_SORT)
  const [message, setMessage] = useState<Message | null>(null)

  useEffect(() => {
    const read = () => {
      const state = fromUrl()
      setGroup(state.group)
      setFolder(state.folder)
    }
    read()
    window.addEventListener('popstate', read)
    return () => window.removeEventListener('popstate', read)
  }, [])

  const go = useCallback((next: { group: TreeGroup; folder: Folder }) => {
    const params = new URLSearchParams({ group: next.group })
    if (next.folder != null) params.set('vendor', String(next.folder))
    window.history.pushState(null, '', `?${params}`)
    setGroup(next.group)
    setFolder(next.folder)
    setQuery('')
    setMessage(null)
  }, [])

  const inGroup = useMemo(() => products.filter((row) => row.group === group), [products, group])

  const vendorRows = useMemo(() => {
    const rows: VendorRow[] = vendors
      .filter((vendor) => vendor.counts[group] > 0)
      .map(({ counts, ...vendor }) => ({ ...vendor, count: counts[group] }))
    return rows.sort(compareBy(vendorSort.key as keyof VendorRow & string, vendorSort.dir))
  }, [vendors, group, vendorSort])

  const orphans = useMemo(() => inGroup.filter((row) => row.vendor == null).length, [inGroup])
  const empty = useMemo(
    () => vendors.filter((vendor) => GROUPS.every((key) => vendor.counts[key] === 0)),
    [vendors],
  )

  const productRows = useMemo(() => {
    const needle = query.trim().toLowerCase()
    const rows = needle
      ? inGroup.filter((row) => row.title.toLowerCase().includes(needle))
      : folder == null
        ? []
        : inGroup.filter((row) => (folder === 'none' ? row.vendor == null : row.vendor === folder))
    return [...rows].sort(compareBy(productSort.key as keyof TreeProduct & string, productSort.dir))
  }, [inGroup, folder, query, productSort])

  /** Запись правки в строку на странице: значение и дата изменения. */
  const put = useCallback((edit: TreeEdit, value: TreeEdit['value'], updatedAt?: string) => {
    const patch = (row: { id: number; updatedAt: string }) => ({
      ...row,
      ...(edit.field === 'order' ? { order: value as number | null } : {}),
      ...(edit.field === 'published' ? { published: value as boolean } : {}),
      ...(updatedAt ? { updatedAt } : {}),
    })
    if (edit.collection === 'manufacturers')
      setVendors((rows) =>
        rows.map((row) => (row.id === edit.id ? { ...row, ...patch(row) } : row)),
      )
    else
      setProducts((rows) =>
        rows.map((row) => (row.id === edit.id ? { ...row, ...patch(row) } : row)),
      )
  }, [])

  /** Сохранить правку из строки. true — сохранено, иначе строка показывает значение из базы. */
  const save = useCallback(
    async (edit: TreeEdit, isUndo = false): Promise<boolean> => {
      try {
        const result = await send(edit)
        if (result.conflict) {
          put(edit, result.value ?? null)
          setMessage({
            kind: 'error',
            text: `«${edit.title}» успели изменить: показано то, что сейчас в базе. Повторите правку.`,
          })
          return false
        }
        put(edit, edit.value, result.updatedAt)
        setMessage({
          kind: 'ok',
          text: `${isUndo ? 'Отменено' : 'Сохранено'}: «${edit.title}» — ${fieldName(edit)}.`,
          undo: isUndo ? undefined : { ...edit, value: edit.was, was: edit.value },
        })
        return true
      } catch (error) {
        setMessage({
          kind: 'error',
          text: error instanceof Error ? error.message : 'Не сохранилось. Повторите.',
        })
        return false
      }
    },
    [put],
  )

  return {
    group,
    folder,
    query,
    setQuery,
    go,
    vendorRows,
    vendorSort,
    setVendorSort,
    productRows,
    productSort,
    setProductSort,
    orphans,
    empty,
    vendorTitle: (id: Folder) =>
      id === 'none' ? 'Без производителя' : (vendors.find((v) => v.id === id)?.title ?? ''),
    message,
    save,
  }
}

export type CatalogTreeState = ReturnType<typeof useCatalogTree>
