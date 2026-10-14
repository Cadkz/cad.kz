/**
 * Таблицы в текстах публикаций (решение владельца 14.10.2026). Старый сайт отдавал таблицы
 * HTML-ом, а первый перенос раскладывал их по ячейке в строку («CUDA Cores», «384», …).
 * Теперь таблица переносится разметкой по строкам: «| ячейка | ячейка |», строка «| --- |»
 * после шапки. Таблицы-раскладки старого сайта (одна колонка, длинный текст в ячейке, таблица
 * в таблице) таблицами не считаются и остаются текстом.
 */

/** Ячейка длиннее — это раскладка страницы, а не таблица данных. */
export const CELL_LIMIT = 200

/**
 * Таблицы верхнего уровня без вложенных таблиц: [{ start, end }] — границы в html.
 * Таблица с таблицей внутри пропускается целиком (раскладка).
 * @param {string} html
 */
export function outerTables(html) {
  const found = []
  const tags = /<table\b[^>]*>|<\/table\s*>/gi
  let depth = 0
  let start = -1
  let nested = false
  for (let match = tags.exec(html); match; match = tags.exec(html)) {
    if (match[0][1] !== '/') {
      if (depth === 0) {
        start = match.index
        nested = false
      } else nested = true
      depth++
    } else if (depth > 0) {
      depth--
      if (depth === 0 && !nested) found.push({ start, end: match.index + match[0].length })
    }
  }
  return found
}

/** colspan / rowspan ячейки: 1–20. */
function spanOf(attrs, name) {
  const value = Number(new RegExp(`${name}\\s*=\\s*["']?(\\d+)`, 'i').exec(attrs ?? '')?.[1])
  return Math.min(Math.max(value || 1, 1), 20)
}

/**
 * Строки и ячейки таблицы HTML: [{ header, cells: [{ html, span, rows }] }]. header — строка
 * шапки (в <thead> или из одних <th>). span — colspan, rows — rowspan.
 * @param {string} table
 */
export function tableCells(table) {
  const head = /<thead\b[\s\S]*?<\/thead\s*>/i.exec(table)
  const rows = []
  for (const row of table.matchAll(
    /<tr\b[^>]*>([\s\S]*?)(?=<tr\b|<\/table|<\/tbody|<\/thead|$)/gi,
  )) {
    const inner = row[1] ?? ''
    const cells = [...inner.matchAll(/<(td|th)\b([^>]*)>([\s\S]*?)(?=<t[dh]\b|<\/tr|$)/gi)].map(
      (cell) => ({
        th: (cell[1] ?? '').toLowerCase() === 'th',
        span: spanOf(cell[2], 'colspan'),
        rows: spanOf(cell[2], 'rowspan'),
        html: (cell[3] ?? '').replace(/<\/t[dh]\s*>\s*$/i, ''),
      }),
    )
    if (!cells.length) continue
    const inHead =
      head != null && row.index >= head.index && row.index < head.index + head[0].length
    rows.push({ header: inHead || cells.every((cell) => cell.th), cells })
  }
  return rows
}

/**
 * Ячейки строк по колонкам с учётом объединений: ячейка с colspan занимает свою колонку и
 * пустые справа, с rowspan — пустые в той же колонке ниже (иначе строки ниже съезжают влево).
 * @template T
 * @param {{ header: boolean, cells: { span: number, rows: number, value: T }[] }[]} rows
 * @param {T} empty
 * @returns {{ header: boolean, cells: T[] }[]}
 */
export function gridRows(rows, empty) {
  /** @type {number[]} сколько строк ниже ещё занято по колонке */
  const carry = []
  return rows.map((row) => {
    const cells = []
    const take = () => {
      while ((carry[cells.length] ?? 0) > 0) {
        carry[cells.length] = (carry[cells.length] ?? 1) - 1
        cells.push(empty)
      }
    }
    for (const cell of row.cells) {
      take()
      for (let i = 0; i < cell.span; i++) {
        if (cell.rows > 1) carry[cells.length] = cell.rows - 1
        cells.push(i ? empty : cell.value)
      }
    }
    // Колонки правее последней ячейки: занятые сверху тоже отсчитывают строку.
    for (let i = cells.length; i < carry.length; i++) carry[i] = Math.max((carry[i] ?? 0) - 1, 0)
    return { header: row.header, cells }
  })
}

/**
 * Таблица текстов → разметка или null, если это не таблица данных. Пустые строки и колонки
 * убираются; «|» внутри ячейки заменяется на «/».
 * @param {{ header: boolean, cells: string[] }[]} rows
 */
export function tableMarkup(rows) {
  const filled = rows
    .map((row) => ({ ...row, cells: row.cells.map((cell) => cell.replace(/\|/g, '/').trim()) }))
    .filter((row) => row.cells.some(Boolean))
  const width = Math.max(0, ...filled.map((row) => row.cells.length))
  const used = Array.from({ length: width }, (_, i) => filled.some((row) => row.cells[i]))
  const clean = filled.map((row) => ({
    header: row.header,
    cells: Array.from({ length: width }, (_, i) => row.cells[i] ?? '').filter((_, i) => used[i]),
  }))
  const columns = used.filter(Boolean).length
  if (columns < 2 || clean.length < 2) return null
  if (clean.some((row) => row.cells.some((cell) => cell.length > CELL_LIMIT))) return null
  const lines = []
  const headRows = clean.findIndex((row) => !row.header)
  clean.forEach((row, i) => {
    lines.push(`| ${row.cells.join(' | ')} |`)
    if (headRows > 0 && i === headRows - 1) lines.push(`|${' --- |'.repeat(columns)}`)
  })
  return lines.join('\n')
}

/**
 * Абзац разметки — таблица: все строки «| … |». → { head, rows } или null. Шапка — строки до
 * «| --- |»; без неё у таблицы из трёх и больше колонок шапкой считается первая строка.
 * @param {string[]} lines
 * @returns {{ head: string[] | null, rows: string[][] } | null}
 */
export function parseTable(lines) {
  if (lines.length < 2 || !lines.every((line) => /^\|.*\|$/.test(line))) return null
  const split = (line) =>
    line
      .slice(1, -1)
      .split('|')
      .map((cell) => cell.trim())
  const divider = lines.findIndex((line) => /^\|(\s*:?-{3,}:?\s*\|)+$/.test(line))
  const body = lines.filter((_, i) => i !== divider).map(split)
  const width = Math.max(...body.map((row) => row.length))
  const rows = body.map((row) => Array.from({ length: width }, (_, i) => row[i] ?? ''))
  const headCount = divider > 0 ? divider : width >= 3 ? 1 : 0
  if (headCount > 1) {
    // Несколько строк шапки (объединённые ячейки старого сайта) — склеиваем в одну.
    const head = rows[0]?.map((_, i) =>
      rows
        .slice(0, headCount)
        .map((row) => row[i])
        .filter(Boolean)
        .join(' '),
    )
    return { head: head ?? null, rows: rows.slice(headCount) }
  }
  return headCount ? { head: rows[0] ?? null, rows: rows.slice(1) } : { head: null, rows }
}

/** Картинка блоком: «![описание](адрес)». */
const PICTURE = /!\[[^\]]*\]\([^)\s]*\)/g
/** Ссылка «[текст](адрес)». */
const LINK = /(?<!!)\[([^\]]*)\]\(([^)\s]*)\)/g

/**
 * Блок текста для сравнения: без картинок, ссылки — только текстом, пробелы схлопнуты.
 * Шаг «Картинки в текстах» после первого переноса поменял адреса картинок и файлов, убрал
 * картинки, которых нет на старом сайте, и переходы /bitrix/redirect.php — текст при этом тот же.
 * @param {string} block
 */
function plain(block) {
  return block.replace(PICTURE, ' ').replace(LINK, '$1').replace(/\s+/g, ' ').trim()
}

/**
 * Где в блоках текста лежит столбик flat (как таблица вышла после первого переноса), начиная
 * с from. Текстовые блоки должны совпасть по plain; картинка столбика — картинкой с любым
 * адресом или отсутствовать (убрана шагом 2). → { at, end } или null.
 * @param {string[]} blocks
 * @param {string[]} flat
 * @param {number} from
 */
function findFlat(blocks, flat, from) {
  const first = flat.findIndex((block) => plain(block))
  if (first < 0) return null
  for (let at = from; at < blocks.length; at++) {
    let i = 0
    let j = at
    while (i < flat.length && j <= blocks.length) {
      const want = plain(flat[i] ?? '')
      const have = j < blocks.length ? plain(blocks[j] ?? '') : null
      if (!want) {
        // Картинка из ячейки: в тексте она картинкой (адрес уже из «Медиа») или её убрали.
        if (have === '') j++
        i++
      } else if (have === want) {
        i++
        j++
      } else break
    }
    if (i === flat.length && j > at) return { at, end: j }
  }
  return null
}

/**
 * Ссылки таблицы берут адреса из текста публикации (там они уже в «Медиа» или без перехода
 * через redirect.php): по тексту ссылки, по порядку. «|» в ячейке таблицы — «/».
 * @param {string} markup
 * @param {string[]} region
 */
function withCurrentLinks(markup, region) {
  const links = region.flatMap((block) =>
    [...block.matchAll(LINK)].map((m) => ({ label: m[1] ?? '', href: m[2] ?? '' })),
  )
  return markup.replace(LINK, (_, label) => {
    const found = links.findIndex((link) => link.label.replace(/\|/g, '/') === label)
    // Нет такой ссылки в тексте — файла не оказалось на старом сайте, остаётся текст.
    if (found < 0) return label
    const [link] = links.splice(found, 1)
    return `[${label}](${link?.href ?? ''})`
  })
}

/**
 * Замена таблиц, разложенных первым переносом по ячейке в строку, на таблицы. flat — как
 * таблица выглядела после первого переноса, markup — таблица. Столбик ищется целыми абзацами
 * по тексту: адреса картинок и ссылок не важны (их поменял шаг «Картинки в текстах»), картинки
 * из ячеек встают сразу после таблицы. Текст, правленный в админке, не трогаем.
 * missed — таблицы, которых нет в тексте ни столбиком, ни уже таблицей (текст правили).
 * @param {string} current текст публикации сейчас
 * @param {{ flat: string, markup: string }[]} tables
 * @returns {{ body: string, replaced: number, missed: number }}
 */
export function withTables(current, tables) {
  const blocks = String(current ?? '')
    .trim()
    .split(/\n\s*\n/)
    .filter((block) => block.trim())
  const done = new Set(blocks.map((block) => plain(block.split('\n')[0] ?? '')))
  let from = 0
  let replaced = 0
  let missed = 0
  for (const { flat, markup } of tables) {
    if (!flat || !markup || flat === markup) continue
    const found = findFlat(blocks, flat.split(/\n\s*\n/), from)
    if (!found) {
      if (!done.has(plain(markup.split('\n')[0] ?? ''))) missed++
      continue
    }
    const region = blocks.slice(found.at, found.end)
    const pictures = region.filter((block) => !plain(block) && block.includes('!['))
    const table = withCurrentLinks(markup, region)
    blocks.splice(found.at, region.length, table, ...pictures)
    from = found.at + 1 + pictures.length
    replaced++
  }
  return { body: replaced ? blocks.join('\n\n') : String(current ?? '').trim(), replaced, missed }
}
