import { buildCatalog, type Catalog } from '@/domain/bitrixCatalog.mjs'
import { detectKind, parseCsv, parseExcelHtml } from '@/domain/bitrixFiles.mjs'
import { type Plan, planImport } from '@/domain/bitrixImport.mjs'

/**
 * Импорт из Битрикса в браузере администратора: чтение выгрузок, сведение каталога и отправка
 * плана на сервер частями. Файлы никуда не загружаются: на сервер уходят только записи плана.
 */

export type { Catalog, Plan }
export type FileKind = 'productsCsv' | 'offersCsv' | 'offerPrices' | 'productPrices'

export const FILE_KINDS: { kind: FileKind; title: string; required: boolean }[] = [
  { kind: 'productsCsv', title: 'Каталог (CSV)', required: true },
  { kind: 'offersCsv', title: 'Торговые предложения (CSV)', required: true },
  { kind: 'offerPrices', title: 'Список предложений с ценами (Excel)', required: false },
  { kind: 'productPrices', title: 'Список товаров с ценами (Excel)', required: false },
]

export type ReadFile = { name: string; kind: FileKind | null; rows: number }
export type Analysis =
  | { ok: true; files: ReadFile[]; catalog: Catalog; plan: Plan; missing: string[] }
  | { ok: false; files: ReadFile[]; error: string }

/** Выгрузки Битрикса бывают в UTF-8 и в Windows-1251: пробуем строгий UTF-8, иначе 1251. */
async function decode(file: File) {
  const buffer = await file.arrayBuffer()
  try {
    return new TextDecoder('utf-8', { fatal: true }).decode(buffer)
  } catch {
    return new TextDecoder('windows-1251').decode(buffer)
  }
}

type Records = Record<string, string>[]

/** Читает выбранные файлы и сводит каталог. Тип файла узнаётся по заголовкам, а не по имени. */
export async function analyzeFiles(list: File[]): Promise<Analysis> {
  const files: ReadFile[] = []
  const tables: Partial<Record<FileKind, Records>> = {}
  for (const file of list) {
    const text = await decode(file)
    const table = /^\s*</.test(text) ? parseExcelHtml(text) : parseCsv(text)
    const kind: FileKind | null = detectKind(table.columns)
    files.push({ name: file.name, kind, rows: table.records.length })
    if (!kind) continue
    if (tables[kind]) {
      const title = FILE_KINDS.find((k) => k.kind === kind)?.title ?? kind
      return { ok: false, files, error: `Выбрано два файла одного вида: ${title}.` }
    }
    tables[kind] = table.records
  }
  const lacking = FILE_KINDS.filter((k) => !tables[k.kind])
  const required = lacking.filter((k) => k.required)
  if (required.length)
    return {
      ok: false,
      files,
      error: `Не хватает файла: ${required.map((k) => k.title).join(', ')}.`,
    }
  const catalog = buildCatalog({
    productsCsv: tables.productsCsv ?? [],
    offersCsv: tables.offersCsv ?? [],
    offerPrices: tables.offerPrices,
    productPrices: tables.productPrices,
  })
  return {
    ok: true,
    files,
    catalog,
    plan: planImport(catalog),
    missing: lacking.map((k) => k.title),
  }
}

/** Делит записи на части: не больше count записей и примерно bytes байт в части. */
export function chunk<T>(items: T[], count: number, bytes = 1_500_000): T[][] {
  const parts: T[][] = []
  let current: T[] = []
  let size = 0
  for (const item of items) {
    const itemSize = JSON.stringify(item).length
    if (current.length && (current.length >= count || size + itemSize > bytes)) {
      parts.push(current)
      current = []
      size = 0
    }
    current.push(item)
    size += itemSize
  }
  if (current.length) parts.push(current)
  return parts
}

export class StepError extends Error {}

/** Один шаг импорта. При сбое сети или сервера пробует ещё раз через пару секунд. */
export async function step<T>(body: Record<string, unknown>): Promise<T> {
  let lastError = 'Нет связи с сайтом.'
  for (let attempt = 0; attempt < 3; attempt++) {
    if (attempt) await new Promise((resolve) => setTimeout(resolve, 2000 * attempt))
    let response: Response
    try {
      response = await fetch('/api/admin/bitrix-import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
    } catch {
      continue
    }
    const data: unknown = await response.json().catch(() => null)
    const error =
      data && typeof data === 'object' && 'error' in data && typeof data.error === 'string'
        ? data.error
        : `Сайт ответил ошибкой ${response.status}.`
    if (response.ok) return data as T
    // Ошибки в данных и правах повтором не исправить: показываем сразу.
    if (response.status < 500) throw new StepError(error)
    lastError = error
  }
  throw new StepError(lastError)
}

/** Отчёт одним файлом, чтобы сохранить или переслать. */
export function downloadText(name: string, text: string, type = 'text/markdown') {
  const url = URL.createObjectURL(new Blob([text], { type: `${type};charset=utf-8` }))
  const link = document.createElement('a')
  link.href = url
  link.download = name
  link.click()
  URL.revokeObjectURL(url)
}

/** Таблица для Excel: разделитель «;», метка UTF-8 в начале, кавычки вокруг каждой ячейки. */
export function toCsv(rows: string[][]): string {
  const cell = (value: string) => `"${value.replaceAll('"', '""')}"`
  return `\uFEFF${rows.map((row) => row.map(cell).join(';')).join('\r\n')}\r\n`
}
