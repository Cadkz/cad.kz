/**
 * Простая разметка текста публикации из поля «Текст» в админке:
 * абзацы разделяются пустой строкой, «## » в начале — заголовок раздела (попадает в оглавление),
 * «### » — подзаголовок внутри раздела, строки «| ячейка | ячейка |» — таблица,
 * строки с «- » — список, «> » — выноска, «![описание](адрес)» отдельным абзацем — картинка
 * из «Медиа» или видео (YouTube, Rutube, VK, Vimeo — `domain/video.mjs`), «[текст](адрес)»
 * внутри текста — ссылка. Без HTML: безопасно выводить как есть.
 */

import { headingCase, headingLevels } from '../domain/outline.mjs'
import { parseTable } from '../domain/tables.mjs'
import {
  fieldLine,
  fieldLines,
  inlineSteps,
  looksLikeHeading,
  splitParagraph,
} from '../domain/typography.mjs'
import { videoEmbed } from '../domain/video.mjs'

export type Block =
  /** level 2 — раздел (в оглавлении), 3 — подзаголовок внутри раздела. */
  | { type: 'heading'; id: string; text: string; level: 2 | 3 }
  | { type: 'paragraph'; text: string }
  | { type: 'list'; items: string[] }
  /** Нумерованные шаги (из «1. … 2. …» в строку или строк «1. …»). */
  | { type: 'steps'; items: string[] }
  /** Пары «подпись — значение» (реквизиты, условия); значение пустое — заголовок группы. */
  | { type: 'fields'; items: { label: string; value: string }[] }
  /** Таблица (характеристики, сравнение комплектаций); head — шапка, если есть. */
  | { type: 'table'; head: string[][] | null; rows: string[][] }
  /** Несколько картинок подряд (сертификаты): превью в ряд, крупно по нажатию. */
  | { type: 'gallery'; images: { alt: string; src: string }[] }
  | { type: 'note'; text: string }
  | { type: 'image'; alt: string; src: string }
  /** Ролик: embed — адрес плеера, watch — страница ролика. */
  | { type: 'video'; title: string; embed: string; watch: string }

/** Кусок строки текста: обычный текст или ссылка. */
export type Inline = { text: string; href?: string }

/** Адрес ссылки или картинки, который можно выводить: свой путь или http(s). */
export function safeHref(value: string): string | null {
  const href = value.trim()
  if (href.startsWith('/') && !href.startsWith('//')) return href
  try {
    const url = new URL(href)
    return url.protocol === 'https:' || url.protocol === 'http:' ? url.toString() : null
  } catch {
    return null
  }
}

const LINK = /\[([^\]]+)\]\(([^)\s]+)\)/g

/** Строка текста с ссылками «[текст](адрес)» → куски. Небезопасная ссылка остаётся текстом. */
export function parseInline(text: string): Inline[] {
  const parts: Inline[] = []
  let last = 0
  for (const match of text.matchAll(LINK)) {
    const [whole, label = '', target = ''] = match
    const start = match.index ?? 0
    if (start > last) parts.push({ text: text.slice(last, start) })
    const href = safeHref(target)
    parts.push(href ? { text: label, href } : { text: label })
    last = start + whole.length
  }
  if (last < text.length) parts.push({ text: text.slice(last) })
  return parts
}

const IMAGE = /^!\[([^\]]*)\]\(([^)\s]+)\)$/

const translit: Record<string, string> = Object.fromEntries(
  'а:a б:b в:v г:g д:d е:e ё:e ж:zh з:z и:i й:y к:k л:l м:m н:n о:o п:p р:r с:s т:t у:u ф:f х:h ц:c ч:ch ш:sh щ:sch ы:y э:e ю:yu я:ya'
    .split(' ')
    .map((pair) => pair.split(':') as [string, string]),
)

export function anchor(text: string) {
  return (
    text
      .toLowerCase()
      .split('')
      .map((ch) => translit[ch] ?? ch)
      .join('')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '') || 'section'
  )
}

export function parseBody(body: string | null | undefined, title?: string | null): Block[] {
  if (!body) return []
  // Подзаголовки, угаданные по короткой строке: всегда h3, в оглавление не попадают.
  const guessed = new WeakSet<Block>()
  const heading = (text: string, level: 2 | 3 = 2): Block => ({
    type: 'heading',
    id: '',
    text,
    level,
  })
  const sameAsTitle = (text: string) =>
    Boolean(title) && text.trim().toLowerCase() === title?.trim().toLowerCase()

  const raw = body
    .split(/\n\s*\n/)
    .map((chunk) => chunk.trim())
    .filter(Boolean)
    .flatMap((chunk): Block[] => {
      if (chunk.startsWith('### ')) return [heading(chunk.slice(4).trim(), 3)]
      if (chunk.startsWith('## ')) return [heading(chunk.slice(3).trim())]
      const image = IMAGE.exec(chunk)
      const video = image ? videoEmbed(image[2]) : null
      if (video) return [{ type: 'video', title: image?.[1] || 'Видео', ...video }]
      const src = image ? safeHref(image[2] ?? '') : null
      if (image && src) return [{ type: 'image', alt: image[1] ?? '', src }]
      const lines = chunk.split('\n').map((line) => line.trim())
      const table = parseTable(lines)
      if (table) return [tableBlock(table)]
      if (lines.every((line) => line.startsWith('- ')))
        return [{ type: 'list', items: lines.map((line) => line.slice(2)) }]
      if (chunk.startsWith('> '))
        return [{ type: 'note', text: lines.map((l) => l.replace(/^> ?/, '')).join(' ') }]
      const fields = fieldLines(lines)
      if (fields) return [{ type: 'fields', items: fields }]
      const text = lines.join(' ')
      const steps = inlineSteps(text)
      if (steps) {
        // Вступление «Как купить» перед шагами: если повторяет заголовок — уберётся ниже.
        const intro: Block[] = steps.intro ? [{ type: 'paragraph', text: steps.intro }] : []
        return [...intro, { type: 'steps', items: steps.items }]
      }
      return splitParagraph(text).map((part): Block => ({ type: 'paragraph', text: part }))
    })

  // Остатки старого сайта — стрелки карусели «‹ ›» (в том числе невидимые сущности &lsaquo;)
  // без текста — не выводим. Строка, повторяющая заголовок страницы, не нужна (h1 уже есть).
  // Короткая строка без точки перед текстом — подзаголовок.
  const kept = withFieldRuns(
    raw.filter((block) => block.type !== 'paragraph' || !isLeftover(block.text)),
  )
  const short = (block: Block | undefined) =>
    block?.type === 'paragraph' && looksLikeHeading(block.text)
  const prose = (block: Block | undefined) =>
    block?.type === 'fields' ||
    block?.type === 'table' ||
    block?.type === 'steps' ||
    (block?.type === 'paragraph' &&
      (block.text.length >= 80 || /[.!?…:]$/u.test(block.text.trim())))
  const blocks = kept.flatMap((block, i): Block[] => {
    if (block.type === 'heading') return sameAsTitle(block.text) ? [] : [block]
    if (block.type !== 'paragraph') return [block]
    if (sameAsTitle(block.text)) return []
    // Только перед настоящим текстом (предложение или длинный абзац): перед списком короткая
    // строка — подводка, после подзаголовка — текст. Короткие строки подряд и пары «GPU Memory —
    // 2 GB» — остатки таблицы со старого сайта, а не подзаголовки.
    const next = kept[i + 1]
    const previous = kept[i - 1]
    if (
      prose(next) &&
      !short(previous) &&
      previous?.type !== 'heading' &&
      looksLikeHeading(block.text)
    ) {
      const guess = heading(block.text, 3)
      guessed.add(guess)
      return [guess]
    }
    return [block]
  })
  return withGalleries(withOutline(blocks, guessed))
}

/**
 * Таблица из двух колонок без шапки («CUDA Cores — 384») — пары «подпись — значение», как
 * реквизиты; остальные — таблица.
 */
function tableBlock(table: { head: string[][] | null; rows: string[][] }): Block {
  if (!table.head && table.rows.every((row) => row.length === 2))
    return {
      type: 'fields',
      items: table.rows.map(([label = '', value = '']) => ({ label, value })),
    }
  return { type: 'table', head: table.head, rows: table.rows }
}

/**
 * Уровни заголовков по правилу «в оглавлении не больше пяти пунктов» (`domain/outline.mjs`),
 * якоря для оглавления. Заголовок-предложение становится обычным абзацем, двоеточие в конце
 * заголовка не нужно, капс — обычным написанием.
 */
function withOutline(blocks: Block[], guessed: WeakSet<Block>): Block[] {
  const levels = headingLevels(
    blocks.map((block) =>
      block.type === 'heading'
        ? {
            heading: true as const,
            text: block.text,
            level: block.level,
            guess: guessed.has(block),
          }
        : { heading: false as const },
    ),
  )
  const used = new Map<string, number>()
  return blocks.flatMap((block, i): Block[] => {
    const level = levels[i]
    if (block.type !== 'heading') return [block]
    if (!level)
      return splitParagraph(block.text).map((text): Block => ({ type: 'paragraph', text }))
    const text = headingCase(block.text.replace(/\s*:$/, ''))
    const base = anchor(text)
    const n = used.get(base) ?? 0
    used.set(base, n + 1)
    return [{ type: 'heading', id: n ? `${base}-${n + 1}` : base, text, level }]
  })
}

/**
 * Реквизиты со старого сайта: каждая строка «БИН: …» — отдельный абзац. Два и больше таких
 * абзаца подряд (с хотя бы двумя значениями) — одна таблица.
 */
function withFieldRuns(blocks: Block[]): Block[] {
  const result: Block[] = []
  let run: { label: string; value: string }[] = []
  let runBlocks: Block[] = []
  const flush = () => {
    if (run.filter((field) => field.value).length >= 2) result.push({ type: 'fields', items: run })
    else result.push(...runBlocks)
    run = []
    runBlocks = []
  }
  for (const block of blocks) {
    const field = block.type === 'paragraph' ? fieldLine(block.text) : null
    if (field) {
      run.push(field)
      runBlocks.push(block)
    } else {
      flush()
      result.push(block)
    }
  }
  flush()
  return result
}

// Остатки старого сайта: стрелки карусели, пустые ссылки и абзацы из одной пунктуации
// (строка «.» в начале статьи — так на старом сайте делали отступ).
const LEFTOVER =
  /^(?:\s|&(?:amp;)?(?:lsaquo|rsaquo|laquo|raquo|nbsp);|[‹›«»<>|.,…·\-–—]|\[[‹›«»<>]*\]\([^)]*\))*$/u

function isLeftover(text: string) {
  return LEFTOVER.test(text)
}

/** Две и больше картинки подряд — одна галерея превью. */
function withGalleries(blocks: Block[]): Block[] {
  const result: Block[] = []
  for (const block of blocks) {
    const last = result.at(-1)
    if (block.type !== 'image') {
      result.push(block)
      continue
    }
    if (last?.type === 'gallery') last.images.push({ alt: block.alt, src: block.src })
    else if (last?.type === 'image') {
      result[result.length - 1] = {
        type: 'gallery',
        images: [
          { alt: last.alt, src: last.src },
          { alt: block.alt, src: block.src },
        ],
      }
    } else result.push(block)
  }
  return result
}

/** Адреса картинок текста — чтобы одним запросом взять их размеры из «Медиа». */
export function imageSources(blocks: Block[]) {
  return blocks.flatMap((block) =>
    block.type === 'image'
      ? [block.src]
      : block.type === 'gallery'
        ? block.images.map((image) => image.src)
        : [],
  )
}

/**
 * Где закончить начало абзаца: после последней точки (!, ?) перед заглавной буквой в пределах
 * budget, но не раньше трети. Внутри ссылки или выделения не режем. Нет такого места — null.
 */
function sentenceCut(text: string, budget: number): number | null {
  let best: number | null = null
  for (const match of text.matchAll(/[.!?]\s+(?=[A-ZА-ЯЁ«"])/g)) {
    const end = (match.index ?? 0) + 1
    if (end > budget) break
    const head = text.slice(0, end)
    const open = (head.match(/\[/g) ?? []).length - (head.match(/\]/g) ?? []).length
    const stars = (head.match(/\*\*/g) ?? []).length
    if (end >= budget / 3 && open === 0 && stars % 2 === 0) best = end
  }
  return best
}

/** Длина блока в знаках: для решения, сколько текста показать сразу. */
function blockLength(block: Block) {
  if (block.type === 'list' || block.type === 'steps') return block.items.join(' ').length
  if (block.type === 'fields') return block.items.map((f) => f.label + f.value).join(' ').length
  if (block.type === 'table') return block.rows.flat().join(' ').length
  if (block.type === 'image' || block.type === 'gallery' || block.type === 'video') return 0
  return block.text.length
}

/**
 * Начало текста для показа сразу и остаток под «Читать полностью». Сразу — не больше двух блоков
 * и примерно budget знаков (первый абзац показывается всегда). Длинное описание из старого сайта
 * остаётся на странице для поисковиков, но не заставляет листать.
 */
export function splitPreview(blocks: Block[], budget = 420): { lead: Block[]; rest: Block[] } {
  // Длинный первый абзац (у программ со старого сайта бывает на полэкрана) режем по концу
  // предложения в пределах budget: обзор не длиннее, чем у Artec Leo (владелец 24.10.2026).
  const [first, ...others] = blocks
  if (first?.type === 'paragraph' && first.text.length > budget * 1.2) {
    const cut = sentenceCut(first.text, budget)
    if (cut)
      return {
        lead: [{ type: 'paragraph', text: first.text.slice(0, cut).trim() }],
        rest: [{ type: 'paragraph', text: first.text.slice(cut).trim() }, ...others],
      }
  }
  const lead: Block[] = []
  let used = 0
  for (const block of blocks) {
    const length = blockLength(block)
    if (lead.length && (lead.length >= 2 || used + length > budget)) break
    lead.push(block)
    used += length
  }
  // Начало не обрывается на подводке к списку («Доп. функции:»): она уходит в свёрнутую часть.
  const last = lead.at(-1)
  if (lead.length > 1 && last?.type === 'paragraph' && last.text.trim().endsWith(':')) lead.pop()
  return { lead, rest: blocks.slice(lead.length) }
}
