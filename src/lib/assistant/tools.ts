import type { Payload } from 'payload'
import { type AssistantCard, checkHandoff, type HandoffDraft } from '@/domain/assistant.mjs'
import { normalizePhone } from '@/domain/order.mjs'
import {
  canTellPrice,
  deliveryTerm,
  distinct,
  formatTiyn,
  type PriceRow,
  priceUnit,
  searchPriceIndex,
  termText,
  vatText,
} from '@/domain/priceTable.mjs'
import { searchCatalog } from '../search'
import { type LoadedPriceTable, loadPriceTable } from './priceTable'

/** Сколько товаров отдаёт поиск модели за раз. */
const SEARCH_LIMIT = 6
/** Сколько строк прайса показывать модели за раз; остальное — числом и вариантами. */
const PRICE_ROWS_LIMIT = 12

export type ToolRunner = {
  run: (name: string, input: unknown) => Promise<unknown>
  /** Товары, которые находил поиск в этом ответе: из них собираются ссылки под ответом. */
  found: AssistantCard[]
  /** Модель подготовила передачу менеджеру: данные для кнопки подтверждения под ответом. */
  handoff: () => HandoffDraft | null
}

function field(input: unknown, name: string) {
  return input && typeof input === 'object' ? (input as Record<string, unknown>)[name] : undefined
}

function text(input: unknown, name: string, max = 120) {
  const value = field(input, name)
  return typeof value === 'string' ? value.replace(/\s+/g, ' ').trim().slice(0, max) : ''
}

/** Карточка под ответом: без описания — оно нужно только модели. */
export function toCard({ id, title, href, vendor, price }: AssistantCard): AssistantCard {
  return { id, title, href, vendor, price }
}

/** Поиск по каталогу тем же поиском, что в шапке сайта (src/lib/search.ts). */
export async function findCards(
  query: string,
): Promise<(AssistantCard & { summary: string | null })[]> {
  const value = query.replace(/\s+/g, ' ').trim().slice(0, 120)
  if (value.length < 2) return []
  const { items } = await searchCatalog(value)
  return items.slice(0, SEARCH_LIMIT).map((item) => ({
    id: item.id,
    title: item.title,
    href: item.href,
    vendor: item.manufacturer,
    price: item.priceFrom ? `от ${item.priceFrom}` : null,
    summary: item.summary,
  }))
}

const NO_PRICE_TABLE = { error: 'Прайс не загружен — стоимость уточняет менеджер' }

/** Строка прайса для модели без цены: по ней выбирают вариант, цену дают по коду. */
function rowBrief(row: PriceRow) {
  return {
    code: row.code,
    article: row.article || null,
    family: row.family || null,
    name: row.name,
    fullName: row.fullName === row.name ? undefined : row.fullName.slice(0, 200),
    purchase: row.purchase || 'не указан',
    term: termText(row.term),
    edition: row.edition || null,
    license: row.license || null,
    seats: row.seats,
    priceStatus: { price: 'цена указана', request: 'по запросу', invalid: 'нет корректной цены' }[
      row.status
    ],
  }
}

/** Поиск по прайсу: строки без цен, сколько всего и чем различаются найденные. */
export function searchPrice(table: LoadedPriceTable, input: unknown) {
  const query = text(input, 'query')
  if (query.length < 2) return { error: 'Нужен запрос: название, артикул или код' }
  const months = Number(field(input, 'termMonths'))
  const term =
    field(input, 'perpetual') === true
      ? ('perpetual' as const)
      : Number.isInteger(months) && months > 0
        ? months
        : undefined
  const result = searchPriceIndex(
    table.index,
    {
      query,
      purchase: text(input, 'purchase', 40) || undefined,
      term,
      edition: text(input, 'edition', 60) || undefined,
      license: text(input, 'license', 60) || undefined,
    },
    PRICE_ROWS_LIMIT,
  )
  if (!result.total)
    return {
      total: 0,
      rows: [],
      note: 'Ничего не нашлось. Попробуй короче, другим написанием или без фильтров; не нашлось — передай менеджеру.',
    }
  const options = {
    families: distinct(result.all, (row) => row.family),
    purchase: distinct(result.all, (row) => row.purchase),
    terms: distinct(result.all, (row) => termText(row.term)),
    editions: distinct(result.all, (row) => row.edition),
    licenses: distinct(result.all, (row) => row.license),
  }
  return {
    total: result.total,
    shown: result.rows.length,
    rows: result.rows.map(rowBrief),
    options,
    ...(result.total > result.rows.length
      ? { note: 'Показана часть строк: сузь поиск фильтрами или уточни у клиента.' }
      : {}),
  }
}

function findRow(table: LoadedPriceTable, code: string) {
  const key = code.trim().toLowerCase()
  return table.rows.find((row) => row.code.toLowerCase() === key) ?? null
}

/** Строка по коду: цена — только если её можно назвать клиенту (раздел 5 правил). */
export function priceByCode(table: LoadedPriceTable, input: unknown) {
  const row = findRow(table, text(input, 'code', 60))
  if (!row) return { error: 'Такого кода в прайсе нет — возьми код из searchPriceList' }
  const allowed = canTellPrice(row)
  return {
    ...rowBrief(row),
    fullName: row.fullName.slice(0, 300),
    unit: priceUnit(row),
    delivery: deliveryTerm(row),
    priceDate: table.summary.updated || null,
    ...(allowed.ok && row.tiyn
      ? { price: formatTiyn(row.tiyn), vat: vatText(table.summary.vat) }
      : { price: null, note: allowed.ok ? 'Цена недоступна' : allowed.reason }),
  }
}

/** Сумма за количество: только цена за место или лицензию, точно, без округления. */
export function totalByCode(table: LoadedPriceTable, input: unknown) {
  const row = findRow(table, text(input, 'code', 60))
  if (!row) return { error: 'Такого кода в прайсе нет — возьми код из searchPriceList' }
  const quantity = Number(field(input, 'quantity'))
  if (!Number.isInteger(quantity) || quantity < 1 || quantity > 999)
    return { error: 'Количество от 1 до 999' }
  const allowed = canTellPrice(row)
  if (!allowed.ok || !row.tiyn) return { error: allowed.ok ? 'Цена недоступна' : allowed.reason }
  if (row.seats && row.seats > 1)
    return { error: 'Это пакет мест — сумму за несколько пакетов уточняет менеджер' }
  return {
    code: row.code,
    name: row.name,
    unit: priceUnit(row),
    unitPrice: formatTiyn(row.tiyn),
    quantity,
    total: formatTiyn((BigInt(row.tiyn) * BigInt(quantity)).toString()),
    vat: vatText(table.summary.vat),
  }
}

/**
 * Инструменты модели: каталог сайта (подбор и ссылки), прайс компании (единственный источник
 * цены), подготовка передачи менеджеру. Ошибку ввода инструмент возвращает словами, чтобы
 * модель поправилась, а не придумывала ответ.
 */
export function createTools(payload: Payload): ToolRunner {
  const found: AssistantCard[] = []
  let table: Promise<LoadedPriceTable | null> | null = null
  let handoff: HandoffDraft | null = null
  const priceTable = () => {
    table ??= loadPriceTable(payload)
    return table
  }

  async function searchProducts(input: unknown) {
    const query = field(input, 'query')
    if (typeof query !== 'string') return { error: 'Нужен текст запроса' }
    const cards = await findCards(query)
    for (const card of cards) if (!found.some((f) => f.id === card.id)) found.push(toCard(card))
    if (!cards.length) return { products: [], note: 'Ничего не нашлось' }
    return {
      products: cards.map((card) => ({
        id: card.id,
        title: card.title,
        vendor: card.vendor,
        family: card.id < 0,
        summary: card.summary?.slice(0, 240) ?? null,
      })),
    }
  }

  async function withTable(run: (loaded: LoadedPriceTable) => unknown) {
    const loaded = await priceTable()
    return loaded ? run(loaded) : NO_PRICE_TABLE
  }

  async function handoffToManager(input: unknown) {
    const checked = checkHandoff(input, normalizePhone)
    if (!checked.ok) return { error: checked.error }
    handoff = checked.draft
    return {
      status: 'shown',
      note: 'Клиенту под ответом показана кнопка «Передать менеджеру» с его данными. Передача выполнится, когда клиент подтвердит. Пока не пиши, что запрос передан.',
    }
  }

  const tools: Record<string, (input: unknown) => Promise<unknown>> = {
    searchProducts,
    searchPriceList: (input) => withTable((loaded) => searchPrice(loaded, input)),
    getPrice: (input) => withTable((loaded) => priceByCode(loaded, input)),
    priceTotal: (input) => withTable((loaded) => totalByCode(loaded, input)),
    handoffToManager,
  }
  return {
    found,
    handoff: () => handoff,
    run(name, input) {
      const tool = tools[name]
      return tool ? tool(input) : Promise.resolve({ error: `Нет инструмента ${name}` })
    },
  }
}
