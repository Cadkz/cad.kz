// Разбор страниц старого cad.kz (1С-Битрикс) для переноса на новый сайт: новости, акции и статьи
// целиком (заголовок, дата, текст, картинки), у товаров — только title и description.
// Без зависимостей: старые страницы однотипные (компонент news.detail), хватает простого разбора.
import { OLD_SITE } from './bitrixImport.mjs'

const NAMED = {
  nbsp: '\u00a0',
  amp: '&',
  lt: '<',
  gt: '>',
  quot: '"',
  apos: "'",
  laquo: '«',
  raquo: '»',
  ldquo: '“',
  rdquo: '”',
  bdquo: '„',
  lsquo: '‘',
  rsquo: '’',
  mdash: '—',
  ndash: '–',
  hellip: '…',
  middot: '·',
  bull: '•',
  deg: '°',
  times: '×',
  copy: '©',
  reg: '®',
  trade: '™',
  shy: '',
  thinsp: ' ',
  ensp: ' ',
  emsp: ' ',
  sup2: '²',
  sup3: '³',
  frac12: '½',
  plusmn: '±',
  euro: '€',
  minus: '−',
}

/** HTML-сущности → символы. Неизвестные остаются как есть. */
export function decodeEntities(text) {
  return String(text ?? '').replace(/&(#x[0-9a-f]+|#\d+|[a-z][a-z0-9]*);/gi, (whole, code) => {
    if (code[0] === '#') {
      const n =
        code[1] === 'x' || code[1] === 'X'
          ? Number.parseInt(code.slice(2), 16)
          : Number(code.slice(1))
      return Number.isFinite(n) && n > 0 && n < 0x110000 ? String.fromCodePoint(n) : whole
    }
    const value = NAMED[code.toLowerCase()]
    return value ?? whole
  })
}

/** Текст без тегов и лишних пробелов. */
export function plainText(html) {
  return decodeEntities(String(html ?? '').replace(/<[^>]*>/g, ' '))
    .replace(/[\s ]+/g, ' ')
    .trim()
}

/** Значение атрибута тега («src», «href»…) или null. */
function attr(tag, name) {
  const match = new RegExp(`\\s${name}\\s*=\\s*(?:"([^"]*)"|'([^']*)'|([^\\s>]+))`, 'i').exec(tag)
  if (!match) return null
  return decodeEntities(match[1] ?? match[2] ?? match[3] ?? '')
}

/** Содержимое <title>. */
export function pageTitle(html) {
  const match = /<title[^>]*>([\s\S]*?)<\/title>/i.exec(html)
  return match ? plainText(match[1]) : ''
}

/** Содержимое <meta name="…" content="…">. Описания с HTML внутри очищаются. */
export function metaContent(html, name) {
  for (const [tag] of html.matchAll(/<meta\b[^>]*>/gi)) {
    if ((attr(tag, 'name') ?? '').toLowerCase() !== name) continue
    return plainText(decodeEntities(attr(tag, 'content') ?? ''))
  }
  return ''
}

/**
 * Внутренность первого <div>, в классе которого есть className, с учётом вложенных div.
 * null, если блока нет.
 */
export function divInner(html, className) {
  const open = new RegExp(
    `<div\\b[^>]*class\\s*=\\s*["'][^"']*\\b${className}\\b[^"']*["'][^>]*>`,
    'i',
  )
  const start = open.exec(html)
  if (!start) return null
  const from = start.index + start[0].length
  const tags = /<div\b[^>]*>|<\/div\s*>/gi
  tags.lastIndex = from
  let depth = 1
  for (let match = tags.exec(html); match; match = tags.exec(html)) {
    depth += match[0][1] === '/' ? -1 : 1
    if (depth === 0) return html.slice(from, match.index)
  }
  return html.slice(from)
}

/**
 * Адрес со старой страницы: свой (относительный или на cad.kz) → путь; чужой http(s) → как есть;
 * остальное (javascript:, mailto: для картинок, якоря) → null.
 */
export function resolveUrl(value, base = OLD_SITE) {
  const raw = String(value ?? '').trim()
  if (!raw || raw.startsWith('#') || /^javascript:/i.test(raw)) return null
  if (/^(mailto|tel):/i.test(raw)) return { external: raw, path: null }
  let url
  try {
    url = new URL(raw, `${base}/`)
  } catch {
    return null
  }
  if (url.protocol !== 'http:' && url.protocol !== 'https:') return null
  const own = url.hostname.replace(/^www\./, '') === new URL(base).hostname
  return own
    ? { external: null, path: decodeURISafe(url.pathname) + url.search }
    : { external: url.toString(), path: null }
}

function decodeURISafe(value) {
  try {
    return decodeURIComponent(value)
  } catch {
    return value
  }
}

const IMAGE_MARK = '\u0000IMG'
const HEADING_MARK = '\u0003'
/** Ссылка ведёт на файл картинки, а не на страницу. */
const IMAGE_FILE = /\.(jpe?g|png|gif|webp)$/i

/** Скобки и пробелы в адресе ломают разметку «[текст](адрес)» — кодируем их. */
function escapeParens(href) {
  return href.replace(/\(/g, '%28').replace(/\)/g, '%29').replace(/\s/g, '%20')
}

/**
 * HTML текста новости → разметка поля «Текст» (абзацы, «## », «- », ссылки, картинки).
 * Картинки со старого сайта записываются полным адресом https://cad.kz/…, их потом скачивает
 * шаг «Картинки в текстах»; картинки с чужих сайтов не переносятся.
 * @returns {{ body: string, images: string[] }} images — пути картинок на старом сайте
 */
export function htmlToMarkup(html, base = OLD_SITE) {
  /** @type {string[]} */
  const images = []
  let text = String(html ?? '')
    .replace(/<!--[\s\S]*?-->/g, ' ')
    .replace(/<(script|style|noindex|noscript|iframe|form|object)\b[\s\S]*?<\/\1\s*>/gi, ' ')
    // Превью в ссылке на полную картинку (сертификаты в «О компании»): берём полную картинку.
    .replace(/<a\b([^>]*)>\s*(<img\b[^>]*>)\s*<\/a\s*>/gi, (_, attrs, img) => {
      const full = resolveUrl(attr(` ${attrs}`, 'href'), base)
      return full?.path && IMAGE_FILE.test(full.path)
        ? img.replace(/\ssrc\s*=\s*(?:"[^"]*"|'[^']*'|[^\s>]+)/i, ` src="${full.path}"`)
        : img
    })
    .replace(/<img\b[^>]*>/gi, (tag) => {
      const target = resolveUrl(attr(tag, 'src'), base)
      if (!target?.path) return ' '
      images.push(target.path)
      const alt = plainText(attr(tag, 'alt') ?? attr(tag, 'title') ?? '').replace(/[[\]]/g, '')
      return `\n\n${IMAGE_MARK}${alt}\u0001${target.path}\u0002\n\n`
    })
    .replace(/<a\b([^>]*)>([\s\S]*?)<\/a\s*>/gi, (_, attrs, inner) => {
      // Ссылка вокруг картинки с подписью: картинку оставляем отдельным блоком, ссылку убираем.
      if (inner.includes(IMAGE_MARK)) return inner
      const label = plainText(inner).replace(/[[\]]/g, '')
      if (!label) return inner
      const target = resolveUrl(attr(` ${attrs}`, 'href'), base)
      const href = target?.path ? encodeURI(target.path) : target?.external
      return href ? `[${label}](${escapeParens(href)})` : label
    })
    .replace(/<h[1-6]\b[^>]*>([\s\S]*?)<\/h[1-6]\s*>/gi, (_, inner) => {
      if (inner.includes(IMAGE_MARK)) return inner
      const heading = plainText(inner)
      return heading ? `\n\n${HEADING_MARK}${heading}\n\n` : '\n\n'
    })
    .replace(/<li\b[^>]*>/gi, '\n- ')
    .replace(/<\/(ul|ol)\s*>/gi, '\n\n')
    .replace(
      /<\/?(p|div|br|table|tbody|thead|tr|ul|ol|blockquote|section|article|center)\b[^>]*>/gi,
      '\n\n',
    )
    .replace(/<\/?(td|th)\b[^>]*>/gi, ' ')
    .replace(/<[^>]*>/g, '')
  text = decodeEntities(text).replace(/ /g, ' ')

  const blocks = text
    .split(/\n\s*\n/)
    .map((chunk) =>
      chunk
        .split('\n')
        .map((line) => line.replace(/[ \t]+/g, ' ').trim())
        .filter((line) => line && line !== '-')
        .join('\n'),
    )
    .filter(Boolean)
    .map((chunk) => {
      if (chunk.startsWith(IMAGE_MARK)) {
        const [alt, path] = chunk.slice(IMAGE_MARK.length).replace('\u0002', '').split('\u0001')
        return `![${alt}](${escapeParens(new URL(path ?? '', base).toString())})`
      }
      if (chunk.startsWith(HEADING_MARK)) return `## ${chunk.slice(1).replace(/\n/g, ' ')}`
      const lines = chunk.split('\n')
      if (lines.every((line) => line.startsWith('- '))) return chunk
      // Обычный абзац не должен случайно стать подзаголовком, списком или выноской.
      return lines.join(' ').replace(/^(#+|>|-)\s+/, '')
    })
    .filter(Boolean)
  return { body: withoutServiceMarks(blocks.join('\n\n')), images }
}

/**
 * Остатки служебных меток и управляющие символы (кроме переноса строки и табуляции) убираются:
 * при любой вёрстке старой страницы они не должны попасть в базу — PostgreSQL не принимает \u0000.
 */
function withoutServiceMarks(text) {
  let rest = text
  for (let start = rest.indexOf(IMAGE_MARK); start >= 0; start = rest.indexOf(IMAGE_MARK)) {
    const end = rest.indexOf('\u0002', start)
    rest = rest.slice(0, start) + (end < 0 ? '' : rest.slice(end + 1))
  }
  return [...rest].filter((char) => char >= ' ' || char === '\n' || char === '\t').join('')
}

/** Дата «26.07.2017» → ISO (полдень по Астане, чтобы день не съехал). null, если не дата. */
export function parseDate(text) {
  const match = /(\d{1,2})\.(\d{1,2})\.(\d{4})/.exec(String(text ?? ''))
  if (!match) return null
  const [, d, m, y] = match.map(Number)
  if (!d || !m || !y || m > 12 || d > 31) return null
  const date = new Date(Date.UTC(y, m - 1, d, 7))
  return Number.isNaN(date.getTime()) ? null : date.toISOString()
}

/** Описание короче этого — шаблонное («Статьи компании CAD.kz»), в анонс и поиск не берём. */
const MIN_DESCRIPTION = 40

/** Первый абзац текста как анонс, не длиннее max знаков. */
export function excerptFrom(body, max = 220) {
  const first = String(body ?? '')
    .split('\n\n')
    .find((block) => !/^(!\[|## |- )/.test(block))
  const text = (first ?? '').replace(/\[([^\]]+)\]\([^)]*\)/g, '$1').trim()
  if (text.length <= max) return text
  const cut = text.slice(0, max - 1)
  const space = cut.lastIndexOf(' ')
  return `${space > max / 2 ? cut.slice(0, space) : cut}…`
}

/**
 * Тип публикации и адрес на новом сайте по старому адресу. null — не новость, акция или статья.
 * @param {string} path
 * @returns {{ kind: 'news' | 'promotion' | 'article', slug: string } | null}
 */
export function publicationTarget(path) {
  const match = /^\/(about\/news|about\/actions|articles)\/([^/?#]+)\/?$/i.exec(String(path))
  if (!match) return null
  /** @type {Record<string, 'news' | 'promotion' | 'article'>} */
  const kinds = { 'about/news': 'news', 'about/actions': 'promotion', articles: 'article' }
  const kind = kinds[match[1].toLowerCase()]
  if (!kind) return null
  const segment = decodeURISafe(match[2])
  if (/\.(php|html?)$/i.test(segment)) return null
  const base = segment
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 90)
    .replace(/-+$/, '')
  const prefix = { news: 'news', promotion: 'action', article: 'article' }[kind]
  const slug = !base || /^\d+$/.test(base) ? `${prefix}-${base || 'page'}` : base
  return { kind, slug }
}

/**
 * Страница новости, акции или статьи старого сайта → запись «Публикации».
 * null, если на странице нет текста новости (не тот шаблон, пустая страница).
 */
export function parsePublicationPage(html, path, base = OLD_SITE) {
  const target = publicationTarget(path)
  const content = divInner(html, 'bx-newsdetail-content')
  if (!target || content == null) return null
  const h1 = /<h1\b[^>]*>([\s\S]*?)<\/h1\s*>/i.exec(html)
  const seoTitle = pageTitle(html)
  const title = (h1 ? plainText(h1[1]) : '') || seoTitle
  if (!title) return null
  const { body, images } = htmlToMarkup(content, base)
  const description = metaContent(html, 'description')
  const goodDescription = description.length >= MIN_DESCRIPTION ? description : ''
  return {
    ...target,
    title,
    publishedAt: parseDate(divInner(html, 'bx-newsdetail-date') ?? ''),
    body,
    images,
    excerpt: excerptFrom(goodDescription || body),
    seo: { title: seoTitle || title, description: goodDescription },
  }
}

/** Страница товара старого сайта → title и description для поисковиков. */
export function parseProductPage(html) {
  const description = metaContent(html, 'description')
  return {
    title: pageTitle(html),
    description: description.length >= MIN_DESCRIPTION ? description : '',
  }
}

/**
 * Текстовые страницы старого сайта, которые переносятся в «Страницы».
 * Адрес на новом сайте — pagePath(slug): «О компании» — /about, остальные — /about/<код>.
 */
export const INFO_PAGES = [
  { path: '/about/', slug: 'about' },
  { path: '/about/howto/', slug: 'howto' },
  { path: '/about/delivery/', slug: 'delivery' },
  { path: '/about/guaranty/', slug: 'guaranty' },
  { path: '/about/essentials.php', slug: 'requisites' },
]

/** Адрес текстовой страницы на новом сайте. */
export function pagePath(slug) {
  return slug === 'about' ? '/about' : `/about/${slug}`
}

/**
 * Текстовая страница старого сайта (блок workarea) → запись «Страницы».
 * Заголовок h1 внутри текста не повторяем. null, если блока нет.
 */
export function parseInfoPage(html, base = OLD_SITE) {
  const content = divInner(html, 'workarea')
  if (content == null) return null
  const h1 = /<h1\b[^>]*>([\s\S]*?)<\/h1\s*>/i.exec(html)
  const seoTitle = pageTitle(html)
  const title = (h1 ? plainText(h1[1]) : '') || seoTitle
  if (!title) return null
  const { body, images } = htmlToMarkup(content.replace(/<h1\b[\s\S]*?<\/h1\s*>/gi, ' '), base)
  if (!body) return null
  const description = metaContent(html, 'description')
  return {
    title,
    body,
    images,
    seo: {
      title: seoTitle || title,
      description: description.length >= MIN_DESCRIPTION ? description : '',
    },
  }
}
