/**
 * Текст публикации в админке (решение владельца 15.10.2026): редактор показывает разметку поля
 * «Текст» как HTML (визуальный режим и режим HTML), а HTML из редактора, из Word или из
 * старого сайта превращает обратно в разметку. В базе по-прежнему разметка: её понимает сайт
 * (`parseBody`), она безопасна (HTML на сайт не попадает) и её не надо переносить.
 *
 * Разметка: абзацы через пустую строку, «## » — раздел, «### » — подзаголовок, «- » — пункт
 * списка, «1. » — шаг, «> » — выноска, «![описание](адрес)» — картинка или видео отдельной
 * строкой, «[текст](адрес)» — ссылка, строки «| … |» — таблица, «| --- |» — конец шапки.
 */
import { decodeEntities } from './legacyPages.mjs'
import { parseTable } from './tables.mjs'
import { videoEmbed } from './video.mjs'

// ---------- Разметка → HTML ----------

/** @param {string} text */
export function escapeHtml(text) {
  return String(text ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

/** Адрес, который можно ставить в ссылку или картинку: свой путь, http(s), почта, телефон. */
export function safeUrl(value) {
  const href = String(value ?? '').trim()
  if (!href) return null
  if (href.startsWith('/') && !href.startsWith('//')) return href
  if (/^(mailto|tel):[^\s<>"]+$/i.test(href)) return href
  try {
    const url = new URL(href)
    return url.protocol === 'https:' || url.protocol === 'http:' ? href : null
  } catch {
    return null
  }
}

const LINK = /\[([^\]]+)\]\(([^)\s]+)\)/g
const IMAGE_LINE = /^!\[([^\]]*)\]\(([^)\s]+)\)$/
const STEP_LINE = /^\d{1,2}[.)]\s+/

/** Строка разметки со ссылками → HTML. */
function inlineHtml(text) {
  let html = ''
  let last = 0
  for (const match of text.matchAll(LINK)) {
    const [whole, label = '', target = ''] = match
    const start = match.index ?? 0
    html += escapeHtml(text.slice(last, start))
    const href = safeUrl(target)
    html += href ? `<a href="${escapeHtml(href)}">${escapeHtml(label)}</a>` : escapeHtml(label)
    last = start + whole.length
  }
  return html + escapeHtml(text.slice(last))
}

/** Видео в редакторе: блок, который нельзя править изнутри, адрес — в data-video. */
export function videoHtml(url, title = 'Видео') {
  return (
    `<figure data-video="${escapeHtml(url)}" title="${escapeHtml(title || 'Видео')}" contenteditable="false">` +
    `<span>▶ ${escapeHtml(title || 'Видео')}</span><small>${escapeHtml(url)}</small></figure>`
  )
}

/** Картинка в редакторе. */
export function imageHtml(src, alt = '') {
  return `<p><img src="${escapeHtml(src)}" alt="${escapeHtml(alt)}"></p>`
}

/** Таблица в редакторе: строки шапки — <th> в <thead>. */
export function tableHtml(head, rows) {
  const row = (cells, tag) =>
    `<tr>${cells.map((cell) => `<${tag}>${inlineHtml(cell) || '<br>'}</${tag}>`).join('')}</tr>`
  const thead = head?.length
    ? `<thead>${head.map((cells) => row(cells, 'th')).join('')}</thead>`
    : ''
  return `<table>${thead}<tbody>${rows.map((cells) => row(cells, 'td')).join('')}</tbody></table>`
}

/** Перенос строки внутри абзаца разметки: в HTML — помеченный <br>. */
const LINE_BREAK_HTML = '<br data-line="1">'

/**
 * Разметка поля «Текст» → HTML для редактора. Каждый блок — с новой строки (так удобнее
 * в режиме HTML).
 * @param {string | null | undefined} markup
 */
export function markupToHtml(markup) {
  return String(markup ?? '')
    .split(/\n\s*\n/)
    .map((chunk) => chunk.trim())
    .filter(Boolean)
    .map((chunk) => {
      if (chunk.startsWith('### ')) return `<h3>${inlineHtml(chunk.slice(4).trim())}</h3>`
      if (chunk.startsWith('## ')) return `<h2>${inlineHtml(chunk.slice(3).trim())}</h2>`
      const image = IMAGE_LINE.exec(chunk)
      if (image) {
        const [, alt = '', src = ''] = image
        if (videoEmbed(src)) return videoHtml(src, alt)
        const safe = safeUrl(src)
        return safe ? imageHtml(safe, alt) : ''
      }
      const lines = chunk.split('\n').map((line) => line.trim())
      const table = parseTable(lines)
      if (table) return tableHtml(table.head, table.rows)
      if (lines.every((line) => line.startsWith('- ')))
        return `<ul>${lines.map((line) => `<li>${inlineHtml(line.slice(2))}</li>`).join('')}</ul>`
      if (lines.length > 1 && lines.every((line) => STEP_LINE.test(line)))
        return `<ol>${lines.map((line) => `<li>${inlineHtml(line.replace(STEP_LINE, ''))}</li>`).join('')}</ol>`
      if (chunk.startsWith('> '))
        return `<blockquote>${inlineHtml(lines.map((l) => l.replace(/^> ?/, '')).join(' '))}</blockquote>`
      // Перенос строки внутри абзаца помечен: при сохранении он остаётся переносом, а не новым
      // абзацем (вставленный из Word или набранный Shift+Enter <br> — по-прежнему новый абзац).
      return `<p>${lines.map(inlineHtml).join(LINE_BREAK_HTML)}</p>`
    })
    .filter(Boolean)
    .join('\n')
}

// ---------- HTML → разметка ----------

/** @typedef {{ tag: string, attrs: string, children: Node[] } | { text: string }} Node */

const VOID = new Set(['img', 'br', 'hr', 'input', 'meta', 'link', 'source', 'wbr', 'col', 'area'])
/** Содержимое не нужно: служебное или не текст. */
const SKIP = new Set([
  'script',
  'style',
  'head',
  'title',
  'template',
  'noscript',
  'svg',
  'button',
  'select',
  'textarea',
  'xml',
])
const BLOCK = new Set([
  'p',
  'div',
  'section',
  'article',
  'header',
  'footer',
  'main',
  'aside',
  'nav',
  'center',
  'figure',
  'figcaption',
  'address',
  'pre',
  'dl',
  'dt',
  'dd',
  'body',
  'html',
  'form',
  'fieldset',
])

/**
 * Закрыть открытый тег из names, если до него по стеку нет тегов из barriers.
 * @param {{ tag: string }[]} stack
 * @param {string[]} names
 * @param {string[]} barriers
 */
function closeOpen(stack, names, barriers) {
  for (let i = stack.length - 1; i > 0; i--) {
    const open = stack[i]?.tag ?? ''
    if (names.includes(open)) {
      stack.length = i
      return
    }
    if (barriers.includes(open) || (open !== 'p' && names[0] === 'p')) return
  }
}

/** Простой разбор HTML в дерево: без зависимостей, терпит незакрытые теги из Word. */
export function parseHtml(html) {
  /** @type {{ tag: string, attrs: string, children: Node[] }} */
  const root = { tag: 'root', attrs: '', children: [] }
  const stack = [root]
  const tokens =
    /<!--[\s\S]*?-->|<!\[CDATA\[[\s\S]*?\]\]>|<![^>]*>|<\?[^>]*>|<(\/?)([a-zA-Z][\w:-]*)([^>]*)>|[^<]+|</g
  for (const match of String(html ?? '').matchAll(tokens)) {
    const [whole, closing, name, attrs = ''] = match
    const top = stack[stack.length - 1] ?? root
    if (!name) {
      if (!whole.startsWith('<!') && !whole.startsWith('<?')) top.children.push({ text: whole })
      continue
    }
    const tag = name.toLowerCase()
    if (closing) {
      const at = stack.map((node) => node.tag).lastIndexOf(tag)
      if (at > 0) stack.length = at
      continue
    }
    // Незакрытые пункты, строки и ячейки (Word, старый HTML) закрываются следующими такими же.
    if (tag === 'li') closeOpen(stack, ['li'], ['ul', 'ol'])
    if (tag === 'tr') closeOpen(stack, ['tr'], ['table', 'thead', 'tbody', 'tfoot'])
    if (tag === 'td' || tag === 'th') closeOpen(stack, ['td', 'th'], ['tr', 'table'])
    if (tag === 'p' || BLOCK.has(tag) || /^(h[1-6]|ul|ol|table|blockquote)$/.test(tag))
      closeOpen(stack, ['p'], [])
    const node = { tag, attrs, children: [] }
    ;(stack[stack.length - 1] ?? root).children.push(node)
    if (!VOID.has(tag) && !attrs.trim().endsWith('/')) stack.push(node)
  }
  return root
}

/** Значение атрибута тега или null. */
function attr(attrs, name) {
  const match = new RegExp(`(?:^|\\s)${name}\\s*=\\s*(?:"([^"]*)"|'([^']*)'|([^\\s>]+))`, 'i').exec(
    attrs,
  )
  return match ? decodeEntities(match[1] ?? match[2] ?? match[3] ?? '') : null
}

/** Пробелы схлопнуты, неразрывный — обычный. */
function squash(text) {
  return text.replace(/[\s ]+/g, ' ')
}

/**
 * Строчный текст узла: ссылки — «[текст](адрес)», остальные теги прозрачны, картинки
 * и видео собираются в media (они выносятся отдельными блоками после строки).
 */
function inlineText(node, media) {
  if ('text' in node) return squash(decodeEntities(node.text))
  if (SKIP.has(node.tag)) return ''
  if (node.tag === 'br') return ' '
  if (node.tag === 'img' || node.tag === 'iframe' || attr(node.attrs, 'data-video') != null) {
    const block = mediaBlock(node)
    if (block) media.push(block)
    return ' '
  }
  const inner = node.children.map((child) => inlineText(child, media)).join('')
  if (node.tag === 'a') {
    const label = inner.replace(/[[\]]/g, '').trim()
    const href = safeUrl(attr(node.attrs, 'href'))
    if (!label) return inner
    return href
      ? `[${label}](${href.replace(/\(/g, '%28').replace(/\)/g, '%29').replace(/\s/g, '%20')})`
      : label
  }
  return inner
}

/** Картинка или видео → строка разметки или null. */
function mediaBlock(node) {
  if ('text' in node) return null
  const video =
    attr(node.attrs, 'data-video') ?? (node.tag === 'iframe' ? attr(node.attrs, 'src') : null)
  if (video != null) {
    if (!videoEmbed(video)) return null
    const title = (attr(node.attrs, 'title') ?? '').replace(/[[\]]/g, '').trim()
    return `![${title || 'Видео'}](${video.trim()})`
  }
  if (node.tag !== 'img') return null
  const src = safeUrl(attr(node.attrs, 'src'))
  // Картинки из буфера (data:) и чужие форматы не храним: их загружают в «Медиа».
  if (!src || /^(mailto|tel):/i.test(src)) return null
  const alt = squash(attr(node.attrs, 'alt') ?? '')
    .replace(/[[\]]/g, '')
    .trim()
  return `![${alt}](${src.replace(/\(/g, '%28').replace(/\)/g, '%29').replace(/\s/g, '%20')})`
}

/** Абзац, случайно начавшийся как разметка, не должен ею стать. */
function plainParagraph(text) {
  // Номер «1. » в начале одного абзаца не трогаем: на сайте это обычный абзац с номером
  // (шагами становятся только строки подряд), а снять его — потерять текст.
  return text
    .replace(/^(#+|>|-)\s+/, '')
    .replace(/^!\[/, '[')
    .replace(/^\|(.*)\|$/, '$1')
}

/** Ячейка таблицы → текст строки разметки. */
function cellText(node, media) {
  return squash(inlineText(node, media)).trim().replace(/\|/g, '/')
}

/** Строки таблицы: thead, tbody, tfoot или сразу tr. Вложенные таблицы не разбираются. */
function tableRows(table) {
  /** @type {{ header: boolean, cells: Node[] }[]} */
  const rows = []
  const visit = (node, inHead) => {
    for (const child of node.children) {
      if ('text' in child) continue
      if (child.tag === 'thead') visit(child, true)
      else if (child.tag === 'tbody' || child.tag === 'tfoot') visit(child, false)
      else if (child.tag === 'tr') {
        const cells = child.children.filter(
          (cell) => !('text' in cell) && (cell.tag === 'td' || cell.tag === 'th'),
        )
        if (cells.length)
          rows.push({
            header: inHead || cells.every((cell) => !('text' in cell) && cell.tag === 'th'),
            cells,
          })
      }
    }
  }
  visit(table, false)
  return rows
}

/** Таблица → строки разметки и картинки из ячеек (идут после таблицы). */
function tableBlock(table) {
  /** @type {string[]} */
  const media = []
  const rows = tableRows(table)
  const width = Math.max(0, ...rows.map((row) => row.cells.reduce((n, cell) => n + span(cell), 0)))
  const lines = rows
    .map((row) => ({
      header: row.header,
      cells: row.cells.flatMap((cell) => [
        cellText(cell, media),
        ...Array(span(cell) - 1).fill(''),
      ]),
    }))
    .map((row) => ({ ...row, cells: Array.from({ length: width }, (_, i) => row.cells[i] ?? '') }))
    .filter((row) => row.cells.some(Boolean))
  if (!lines.length || width < 1) return media
  const headRows = lines.findIndex((row) => !row.header)
  const out = []
  lines.forEach((row, i) => {
    out.push(`| ${row.cells.join(' | ')} |`)
    const lastHead = headRows < 0 ? lines.length - 1 : headRows - 1
    if (lastHead >= 0 && i === lastHead && row.header) out.push(`|${' --- |'.repeat(width)}`)
  })
  // Одна строка без шапки — не таблица для сайта: тогда это строка текста.
  if (out.length < 2)
    return [plainParagraph(lines[0]?.cells.filter(Boolean).join(' — ') ?? ''), ...media]
  return [out.join('\n'), ...media]
}

function span(cell) {
  if ('text' in cell) return 1
  return Math.min(Math.max(Number(attr(cell.attrs, 'colspan')) || 1, 1), 20)
}

/**
 * HTML (из редактора, Word, старого сайта) → разметка поля «Текст». Жирный, курсив, цвета
 * и шрифты не переносятся: на сайте у текста единый вид.
 * @param {string} html
 */
export function htmlToMarkup(html) {
  /** @type {string[]} */
  const blocks = []
  /** @type {string[]} строчный текст текущего абзаца */
  let line = []
  /** @type {string[]} картинки, встреченные внутри абзаца */
  let pending = []
  const flush = () => {
    const text = squash(line.join(''))
      .trim()
      .replace(/ ?\uE000 ?/g, '\n')
      .replace(/^\n+|\n+$/g, '')
    if (text) blocks.push(plainParagraph(text))
    blocks.push(...pending)
    line = []
    pending = []
  }
  const list = (node, ordered) => {
    flush()
    const items = []
    /** @type {string[]} */
    const media = []
    const visit = (parent) => {
      for (const child of parent.children) {
        if ('text' in child || child.tag !== 'li') {
          if (!('text' in child) && (child.tag === 'ul' || child.tag === 'ol')) visit(child)
          continue
        }
        const own = {
          ...child,
          children: child.children.filter((c) => 'text' in c || (c.tag !== 'ul' && c.tag !== 'ol')),
        }
        const text = squash(inlineText(own, media)).trim()
        if (text) items.push(text)
        for (const nested of child.children)
          if (!('text' in nested) && (nested.tag === 'ul' || nested.tag === 'ol')) visit(nested)
      }
    }
    visit(node)
    if (items.length)
      blocks.push(
        items
          .map((item, i) => (ordered && items.length > 1 ? `${i + 1}. ${item}` : `- ${item}`))
          .join('\n'),
      )
    blocks.push(...media)
  }
  const walk = (node) => {
    if ('text' in node) {
      line.push(squash(decodeEntities(node.text)))
      return
    }
    const { tag } = node
    if (SKIP.has(tag)) return
    if (tag === 'img' || tag === 'iframe' || attr(node.attrs, 'data-video') != null) {
      const block = mediaBlock(node)
      flush()
      if (block) blocks.push(block)
      return
    }
    if (/^h[1-6]$/.test(tag)) {
      flush()
      /** @type {string[]} */
      const media = []
      const text = squash(inlineText(node, media))
        .trim()
        .replace(/^#+\s*/, '')
      if (text) blocks.push(`${tag === 'h1' || tag === 'h2' ? '##' : '###'} ${text}`)
      blocks.push(...media)
      return
    }
    if (tag === 'ul' || tag === 'ol') return list(node, tag === 'ol')
    if (tag === 'table') {
      flush()
      blocks.push(...tableBlock(node).filter(Boolean))
      return
    }
    if (tag === 'blockquote') {
      flush()
      /** @type {string[]} */
      const media = []
      const text = squash(inlineText(node, media)).trim()
      if (text) blocks.push(`> ${text}`)
      blocks.push(...media)
      return
    }
    if (tag === 'br' && attr(node.attrs, 'data-line') != null) {
      // Метка переноса внутри абзаца (см. markupToHtml): пробелом её не схлопнуть.
      line.push('\uE000')
      return
    }
    if (tag === 'br' || tag === 'hr') return flush()
    if (tag === 'a') {
      /** @type {string[]} */
      const media = []
      line.push(inlineText(node, media))
      pending.push(...media)
      return
    }
    if (BLOCK.has(tag) || tag === 'li' || tag === 'tr' || tag === 'td' || tag === 'th') {
      flush()
      for (const child of node.children) walk(child)
      flush()
      return
    }
    for (const child of node.children) walk(child)
  }
  walk(parseHtml(html))
  flush()
  return blocks
    .map((block) =>
      block
        .replace(/[^\S\n]+/g, ' ')
        .replace(/ +\n|\n +/g, '\n')
        .trim(),
    )
    .filter(Boolean)
    .join('\n\n')
}
