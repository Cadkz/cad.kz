// Описание товара из Битрикса (HTML) в простую разметку поля «Описание» нового сайта
// (src/lib/richText.ts): пустая строка — новый абзац, «## » — подзаголовок, «- » — пункт списка.
// Картинки, видео, стили и ссылки из старого HTML не переносятся: остаётся текст.
import { decodeEntities } from './bitrixFiles.mjs'
import { gridRows, outerTables, tableCells, tableMarkup } from './tables.mjs'

const BLOCK_BREAK = '\n\n'

/** Строчные теги (жирный, ссылка…) убираются без пробела, чтобы не было «САПР .». */
const INLINE_TAGS = /<\/?(a|b|strong|i|em|u|s|span|font|sup|sub|small|mark|abbr)\b[^>]*>/gi

/** Текст внутри тега без вложенной разметки, в одну строку. */
const inline = (html) =>
  decodeEntities(
    String(html)
      .replace(INLINE_TAGS, '')
      .replace(/<[^>]+>/g, ' '),
  )
    .replace(/\s+/g, ' ')
    .trim()

/** Перенос без таблиц: каждая ячейка — отдельной строкой (так работал первый перенос). */
function flatMarkup(html) {
  const source = String(html ?? '')
  if (!source.trim()) return ''
  const text = source
    .replace(/<(script|style|iframe|noscript)[^>]*>[\s\S]*?<\/\1>/gi, ' ')
    .replace(/<!--[\s\S]*?-->/g, ' ')
    .replace(INLINE_TAGS, '')
    // Переносы строк в исходном HTML ничего не значат: значение имеют только теги.
    .replace(/[\r\n]+/g, ' ')
    .replace(/<h[1-6][^>]*>([\s\S]*?)<\/h[1-6]>/gi, (_, inner) => {
      const title = inline(inner)
      return title ? `${BLOCK_BREAK}## ${title}${BLOCK_BREAK}` : BLOCK_BREAK
    })
    .replace(/<li[^>]*>([\s\S]*?)<\/li>/gi, (_, inner) => {
      const item = inline(inner)
      return item ? `\n- ${item}\n` : ''
    })
    .replace(/<\/?(ul|ol)[^>]*>/gi, BLOCK_BREAK)
    .replace(/<\/t[dh]>/gi, ' — ')
    .replace(/<\/?(p|div|table|tbody|thead|tr|section|article|blockquote)[^>]*>/gi, BLOCK_BREAK)
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<[^>]+>/g, ' ')

  return (
    decodeEntities(text)
      .split('\n')
      .map((line) =>
        line
          .replace(/[ \t ]+/g, ' ')
          .replace(/( — )+$/, '')
          .replace(/^( — )+/, '')
          .trim(),
      )
      .join('\n')
      // Пункты списка, стоящие подряд, — один список; от соседнего текста — пустая строка.
      .replace(/^(- .*)\n{2,}(?=- )/gm, '$1\n')
      .replace(/^(- .*)\n(?!- |\n)/gm, `$1${BLOCK_BREAK}`)
      .replace(/^((?!- ).+)\n(?=- )/gm, `$1${BLOCK_BREAK}`)
      .replace(/\n{3,}/g, BLOCK_BREAK)
      .trim()
  )
}

/** Ячейка таблицы в одну строку: пункты списка через «; », картинки (значки) не переносятся. */
const cellText = (html) =>
  inline(
    String(html)
      .replace(/<\/li\s*>/gi, '; ')
      .replace(/<br\s*\/?>/gi, '; '),
  )
    .replace(/(\s*;\s*)+/g, '; ')
    .replace(/^;\s*|;\s*$/g, '')

/**
 * Таблицы данных в HTML описания: [{ start, end, flat, markup }]. flat — как таблица выглядела
 * после первого переноса (ячейка в строку), markup — таблица разметкой «| … |» (src/domain/
 * tables.mjs). Таблицы-раскладки (одна колонка, длинный текст, баннер) не попадают.
 * @param {string} html
 */
export function descriptionTables(html) {
  const source = String(html ?? '')
  return outerTables(source).flatMap(({ start, end }) => {
    const table = source.slice(start, end)
    const rows = tableCells(table).map((row) => ({
      header: row.header,
      cells: row.cells.map((cell) => ({ ...cell, value: cellText(cell.html) })),
    }))
    const markup = tableMarkup(gridRows(rows, ''))
    return markup ? [{ start, end, flat: flatMarkup(table), markup }] : []
  })
}

/**
 * Описание товара из Битрикса (HTML) → разметка поля «Описание». Таблицы данных (сравнение
 * AutoCAD и AutoCAD LT, системные требования) — таблицами, а не ячейкой в строку.
 * @param {string | null | undefined} html
 */
export function htmlToMarkup(html) {
  const source = String(html ?? '')
  const tables = descriptionTables(source)
  if (!tables.length) return flatMarkup(source)
  const MARK = 'bxtablemark'
  const parts = []
  let last = 0
  tables.forEach(({ start, end }, i) => {
    parts.push(source.slice(last, start), `<p>${MARK}${i}</p>`)
    last = end
  })
  parts.push(source.slice(last))
  return flatMarkup(parts.join('')).replace(
    new RegExp(`^${MARK}(\\d+)$`, 'gm'),
    (_, i) => tables[Number(i)]?.markup ?? '',
  )
}
