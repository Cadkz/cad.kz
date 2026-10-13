/**
 * Простая разметка текста публикации из поля «Текст» в админке:
 * абзацы разделяются пустой строкой, «## » в начале — подзаголовок раздела,
 * строки с «- » — список, «> » — выноска, «![описание](адрес)» отдельным абзацем — картинка
 * из «Медиа», «[текст](адрес)» внутри текста — ссылка. Без HTML: безопасно выводить как есть.
 */
import {
  fieldLine,
  fieldLines,
  inlineSteps,
  looksLikeHeading,
  splitParagraph,
} from '../domain/typography.mjs'

export type Block =
  | { type: 'heading'; id: string; text: string }
  | { type: 'paragraph'; text: string }
  | { type: 'list'; items: string[] }
  /** Нумерованные шаги (из «1. … 2. …» в строку или строк «1. …»). */
  | { type: 'steps'; items: string[] }
  /** Пары «подпись — значение» (реквизиты, условия); значение пустое — заголовок группы. */
  | { type: 'fields'; items: { label: string; value: string }[] }
  /** Несколько картинок подряд (сертификаты): превью в ряд, крупно по нажатию. */
  | { type: 'gallery'; images: { alt: string; src: string }[] }
  | { type: 'note'; text: string }
  | { type: 'image'; alt: string; src: string }

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
  const used = new Map<string, number>()
  const heading = (text: string): Block => {
    const base = anchor(text)
    const n = used.get(base) ?? 0
    used.set(base, n + 1)
    return { type: 'heading', id: n ? `${base}-${n + 1}` : base, text }
  }
  const sameAsTitle = (text: string) =>
    Boolean(title) && text.trim().toLowerCase() === title?.trim().toLowerCase()

  const raw = body
    .split(/\n\s*\n/)
    .map((chunk) => chunk.trim())
    .filter(Boolean)
    .flatMap((chunk): Block[] => {
      if (chunk.startsWith('## ')) return [heading(chunk.slice(3).trim())]
      const image = IMAGE.exec(chunk)
      const src = image ? safeHref(image[2] ?? '') : null
      if (image && src) return [{ type: 'image', alt: image[1] ?? '', src }]
      const lines = chunk.split('\n').map((line) => line.trim())
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
  const blocks = kept.flatMap((block, i): Block[] => {
    if (block.type !== 'paragraph') return [block]
    if (sameAsTitle(block.text)) return []
    // Только между текстом: перед списком короткая строка — подводка, после подзаголовка — текст.
    const next = kept[i + 1]
    const previous = kept[i - 1]
    const textNext = next?.type === 'paragraph' || next?.type === 'fields' || next?.type === 'steps'
    if (textNext && previous?.type !== 'heading' && looksLikeHeading(block.text))
      return [heading(block.text)]
    return [block]
  })
  return withGalleries(blocks)
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

const LEFTOVER =
  /^(?:\s|&(?:amp;)?(?:lsaquo|rsaquo|laquo|raquo|nbsp);|[‹›«»<>|]|\[[‹›«»<>]*\]\([^)]*\))*$/u

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

/** Длина блока в знаках: для решения, сколько текста показать сразу. */
function blockLength(block: Block) {
  if (block.type === 'list' || block.type === 'steps') return block.items.join(' ').length
  if (block.type === 'fields') return block.items.map((f) => f.label + f.value).join(' ').length
  if (block.type === 'image' || block.type === 'gallery') return 0
  return block.text.length
}

/**
 * Начало текста для показа сразу и остаток под «Читать полностью». Сразу — не больше двух блоков
 * и примерно budget знаков (первый абзац показывается всегда). Длинное описание из старого сайта
 * остаётся на странице для поисковиков, но не заставляет листать.
 */
export function splitPreview(blocks: Block[], budget = 420): { lead: Block[]; rest: Block[] } {
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
