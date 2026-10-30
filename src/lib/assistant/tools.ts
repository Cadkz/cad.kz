import type { Payload } from 'payload'
import {
  type AssistantCard,
  type AssistantVariant,
  checkHandoff,
  type HandoffDraft,
  sitePageCard,
} from '@/domain/assistant.mjs'
import { courseWords, groupBrief, upcoming } from '@/domain/courseSchedule.mjs'
import { normalizePhone } from '@/domain/order.mjs'
import {
  canTellPrice,
  deliveryTerm,
  distinct,
  formatTiyn,
  type PriceRow,
  priceUnit,
  searchPriceIndex,
  sumPriceRows,
  termText,
  totalItems,
  vatText,
} from '@/domain/priceTable.mjs'
import { siteTiyn } from '@/domain/pricing.mjs'
import { type SiteEntry, siteBlocksPrice } from '@/domain/sitePrice.mjs'
import { getCatalog } from '../catalog'
import { courseMatches, groupsForCourse } from '../courseSchedule'
import { searchCatalog } from '../search'
import { type LoadedPriceTable, loadPriceTable } from './priceTable'

/** Сколько товаров отдаёт поиск модели за раз. */
const SEARCH_LIMIT = 6
/** Сколько строк прайса показывать модели за раз; остальное — числом и вариантами. */
const PRICE_ROWS_LIMIT = 12
/** Сколько вариантов одного товара (модули GEO5 — около 45) отдавать модели. */
const VARIANTS_LIMIT = 60

export type ToolRunner = {
  run: (name: string, input: unknown) => Promise<unknown>
  /** Товары, которые находил поиск в этом ответе: из них собираются ссылки под ответом. */
  found: AssistantCard[]
  /** Варианты найденных товаров (модули, пакеты): ссылка сразу на выбранный вариант. */
  variants: AssistantVariant[]
  /** Модель подготовила передачу менеджеру: данные для кнопки подтверждения под ответом. */
  handoff: () => HandoffDraft | null
  /** Разделы сайта (корзина, реквизиты…), которые модель попросила показать кнопкой. */
  pages: AssistantCard[]
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

export type FoundCard = AssistantCard & { summary: string | null; variants: AssistantVariant[] }

/**
 * Поиск по каталогу тем же поиском, что в шапке сайта (src/lib/search.ts). У товара с подбором
 * или семейства — его варианты (src/lib/catalogVariants.ts): модули, пакеты, редакции.
 */
export async function findCards(query: string): Promise<FoundCard[]> {
  const value = query.replace(/\s+/g, ' ').trim().slice(0, 120)
  if (value.length < 2) return []
  const catalog = getCatalog()
  const [{ items }, { variants }] = await Promise.all([searchCatalog(value, catalog), catalog])
  return items.slice(0, SEARCH_LIMIT).map((item) => ({
    id: item.id,
    title: item.title,
    href: item.href,
    vendor: item.manufacturer,
    price: item.priceFrom ? `от ${item.priceFrom}` : null,
    summary: item.summary,
    variants: variants
      .filter((variant) => variant.parent === item.id)
      .slice(0, VARIANTS_LIMIT)
      .map((variant) => ({
        id: variant.id,
        title: variant.title,
        href: variant.href,
        vendor: item.manufacturer,
        price: variant.priceFrom ? `от ${variant.priceFrom}` : null,
        parent: item.id,
        label: variant.label,
        about: variant.about,
      })),
  }))
}

const NO_PRICE_TABLE = { error: 'Прайс не загружен — стоимость уточняет менеджер' }

/**
 * Товары и варианты каталога с ценой «от» или «по запросу» — чтобы Кадди не называл число там,
 * где сайт пишет «Цена по запросу» (src/domain/sitePrice.mjs). Каталог закеширован на запрос.
 */
export async function siteEntries(): Promise<SiteEntry[]> {
  const { items, variants } = await getCatalog()
  return [
    ...items.map((item) => ({ title: item.title, priceFrom: item.priceFrom, variant: false })),
    ...variants.map((v) => ({ title: v.title, priceFrom: v.priceFrom, variant: true })),
  ]
}

/** Строка прайса для модели без цены: по ней выбирают вариант, цену дают по коду. */
function rowBrief(row: PriceRow, site: SiteEntry[] = []) {
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
    priceStatus: siteBlocksPrice(row, site)
      ? 'по запросу (так на сайте)'
      : { price: 'цена указана', request: 'по запросу', invalid: 'нет корректной цены' }[
          row.status
        ],
  }
}

/** Поиск по прайсу: строки без цен, сколько всего и чем различаются найденные. */
export function searchPrice(table: LoadedPriceTable, input: unknown, site: SiteEntry[] = []) {
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
    rows: result.rows.map((row) => rowBrief(row, site)),
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

/**
 * Можно ли назвать цену строки: правила прайса (canTellPrice), затем сайт — у товара на сайте
 * «Цена по запросу», значит и Кадди число не называет (аудит 21.10.2026, К7).
 */
function tellPrice(row: PriceRow, site: SiteEntry[]) {
  const allowed = canTellPrice(row)
  if (!allowed.ok) return allowed
  const blocked = siteBlocksPrice(row, site)
  return blocked ? { ok: false as const, reason: blocked } : allowed
}

/** Строка по коду: цена — только если её можно назвать клиенту (раздел 5 правил). */
export function priceByCode(table: LoadedPriceTable, input: unknown, site: SiteEntry[] = []) {
  const row = findRow(table, text(input, 'code', 60))
  if (!row) return { error: 'Такого кода в прайсе нет — возьми код из searchPriceList' }
  const allowed = tellPrice(row, site)
  return {
    ...rowBrief(row, site),
    fullName: row.fullName.slice(0, 300),
    unit: priceUnit(row),
    delivery: deliveryTerm(row),
    priceDate: table.summary.updated || null,
    ...(allowed.ok && row.tiyn
      ? { price: formatTiyn(siteTiyn(row.tiyn)), vat: vatText(table.summary.vat) }
      : { price: null, note: allowed.ok ? 'Цена недоступна' : allowed.reason }),
  }
}

/** Сумма за одну или несколько позиций с количеством: точно, без округления (sumPriceRows). */
export function totalByCode(table: LoadedPriceTable, input: unknown, site: SiteEntry[] = []) {
  const items = totalItems(input)
  if (typeof items === 'string') return { error: items }
  return sumPriceRows(table.rows, items, table.summary.vat, (row) => siteBlocksPrice(row, site))
}

/**
 * Инструменты модели: каталог сайта (подбор и ссылки), прайс компании (единственный источник
 * цены), подготовка передачи менеджеру. Ошибку ввода инструмент возвращает словами, чтобы
 * модель поправилась, а не придумывала ответ.
 */
export function createTools(payload: Payload): ToolRunner {
  const found: AssistantCard[] = []
  const variants: AssistantVariant[] = []
  const pages: AssistantCard[] = []
  let table: Promise<LoadedPriceTable | null> | null = null
  let site: Promise<SiteEntry[]> | null = null
  let handoff: HandoffDraft | null = null
  const priceTable = () => {
    table ??= loadPriceTable(payload)
    return table
  }

  async function searchProducts(input: unknown) {
    const query = field(input, 'query')
    if (typeof query !== 'string') return { error: 'Нужен текст запроса' }
    const cards = await findCards(query)
    for (const card of cards) {
      if (found.some((f) => f.id === card.id)) continue
      found.push(toCard(card))
      variants.push(...card.variants)
    }
    if (!cards.length) return { products: [], note: 'Ничего не нашлось' }
    const withVariants = cards.some((card) => card.variants.length)
    return {
      products: cards.map((card) => ({
        id: card.id,
        title: card.title,
        vendor: card.vendor,
        family: card.id < 0,
        summary: card.summary?.slice(0, 240) ?? null,
        ...(card.variants.length
          ? {
              variants: card.variants.map((v) =>
                v.about ? { name: v.label, about: v.about } : { name: v.label },
              ),
            }
          : {}),
      })),
      ...(withVariants
        ? {
            note: 'variants — модули, пакеты и редакции внутри товара. Советуй один вариант под задачу и пиши его с названием товара, точно как name: «GEO5 Устойчивость откоса». Под ответом будет ссылка сразу на этот вариант.',
          }
        : {}),
    }
  }

  // Каталог не загрузился — цены сверяются только по прайсу, как раньше: ответ важнее сверки.
  const catalogEntries = () => {
    site ??= siteEntries().catch(() => [])
    return site
  }

  async function withTable(run: (loaded: LoadedPriceTable, entries: SiteEntry[]) => unknown) {
    const [loaded, entries] = await Promise.all([priceTable(), catalogEntries()])
    return loaded ? run(loaded, entries) : NO_PRICE_TABLE
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

  async function showSitePage(input: unknown) {
    const card = sitePageCard(field(input, 'page'))
    if (!card) return { error: 'Нет такого раздела' }
    if (!pages.some((p) => p.href === card.href)) pages.push(card)
    return { status: 'shown', title: card.title, note: 'Под ответом кнопка на этот раздел.' }
  }

  /**
   * Расписание курсов УЦ: ближайшие группы (даты, занятия, время, формат). Цена — как на сайте
   * (карточка курса), не из таблицы. Курс есть на сайте — ссылка под ответом.
   */
  async function courseSchedule(input: unknown) {
    const words = courseWords(text(input, 'query', 80))
    const [matches, catalog] = await Promise.all([courseMatches(payload), getCatalog()])
    if (!matches.schedule.fetchedAt)
      return {
        courses: [],
        note: 'Расписание недоступно — даты уточнит менеджер (handoffToManager).',
      }
    const byHref = new Map(catalog.items.map((item) => [item.href, item]))
    const fits = (titles: string[]) =>
      !words.length ||
      titles.some((title) => {
        const own = courseWords(title)
        return words.every((word) => own.some((w) => w.startsWith(word) || word.startsWith(w)))
      })
    const result = matches.programs
      .map((program) => {
        const course = matches.courses.find((c) => c.id === program.courseId) ?? null
        const groups = course
          ? groupsForCourse(matches, course.id)
          : upcoming(program.groups, matches.today)
        return { program, course, groups }
      })
      .filter(
        ({ program, course, groups }) =>
          groups.length && fits([...program.titles, course?.title ?? '']),
      )
      .sort((a, b) => (a.groups[0]?.start ?? '').localeCompare(b.groups[0]?.start ?? ''))
    // Один курс каталога может собрать несколько программ — показываем его один раз.
    const seen = new Set<string>()
    const courses = result
      .filter(({ program, course }) => {
        const key = course ? `c${course.id}` : program.key
        if (seen.has(key)) return false
        seen.add(key)
        return true
      })
      .slice(0, 8)
      .map(({ program, course, groups }) => {
        const listed = course ? byHref.get(course.href) : undefined
        if (course && listed && !found.some((f) => f.id === listed.id))
          found.push(
            toCard({
              id: listed.id,
              title: listed.title,
              href: listed.href,
              vendor: listed.manufacturer,
              price: listed.priceFrom ? `от ${listed.priceFrom}` : null,
            }),
          )
        return {
          title: course?.title ?? program.title,
          onSite: Boolean(listed),
          price: listed?.priceFrom ?? null,
          groups: groups.slice(0, 3).map((group) => groupBrief(group, matches.today)),
        }
      })
    if (!courses.length)
      return {
        courses: [],
        note: 'Ближайших групп по этому запросу нет. Предложи менеджера: он скажет, когда будет набор, или соберёт корпоративную группу.',
      }
    return {
      today: matches.today,
      courses,
      note: 'onSite: false — курса нет на сайте, записаться можно через менеджера (handoffToManager). price — цена на сайте; нет — стоимость уточнит менеджер.',
    }
  }

  const tools: Record<string, (input: unknown) => Promise<unknown>> = {
    courseSchedule,
    searchProducts,
    searchPriceList: (input) => withTable((loaded, entries) => searchPrice(loaded, input, entries)),
    getPrice: (input) => withTable((loaded, entries) => priceByCode(loaded, input, entries)),
    priceTotal: (input) => withTable((loaded, entries) => totalByCode(loaded, input, entries)),
    handoffToManager,
    showSitePage,
  }
  return {
    found,
    variants,
    pages,
    handoff: () => handoff,
    run(name, input) {
      const tool = tools[name]
      return tool ? tool(input) : Promise.resolve({ error: `Нет инструмента ${name}` })
    },
  }
}
