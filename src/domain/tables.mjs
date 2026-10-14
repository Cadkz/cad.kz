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

/**
 * Строки и ячейки таблицы HTML: [{ header, cells: [{ html, span }] }]. header — строка шапки
 * (в <thead> или из одних <th>). span — colspan.
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
        span: Math.min(
          Math.max(Number(/colspan\s*=\s*["']?(\d+)/i.exec(cell[2] ?? '')?.[1]) || 1, 1),
          20,
        ),
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

/**
 * Замена таблиц, разложенных первым переносом по ячейке в строку, на таблицы. flat — как
 * таблица выглядела после первого переноса, markup — таблица. Меняется только точное
 * совпадение целыми абзацами: текст, правленный в админке, не трогаем.
 * @param {string} current текст публикации сейчас
 * @param {{ flat: string, markup: string }[]} tables
 * @returns {{ body: string, replaced: number }}
 */
export function withTables(current, tables) {
  let body = `\n\n${String(current ?? '').trim()}\n\n`
  let from = 0
  let replaced = 0
  for (const { flat, markup } of tables) {
    if (!flat || !markup || flat === markup) continue
    const at = body.indexOf(`\n\n${flat}\n\n`, from)
    if (at < 0) continue
    body = `${body.slice(0, at)}\n\n${markup}\n\n${body.slice(at + flat.length + 4)}`
    from = at + markup.length + 2
    replaced++
  }
  return { body: body.trim(), replaced }
}
