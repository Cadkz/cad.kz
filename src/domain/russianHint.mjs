// @ts-check

/**
 * Подсказка русского текста под полем перевода в админке (src/components/RussianHint): значение
 * по пути поля Payload и короткий читаемый вид текста.
 */

/**
 * Значение по пути поля Payload: `title`, `seo.title`, `tasks.0.title`, `faq.2.answer`.
 * @param {unknown} doc @param {string} path
 * @returns {unknown}
 */
export function valueAtPath(doc, path) {
  /** @type {unknown} */
  let value = doc
  for (const part of path.split('.')) {
    if (value === null || typeof value !== 'object') return undefined
    value =
      /^\d+$/.test(part) && Array.isArray(value)
        ? value[Number(part)]
        : /** @type {Record<string, unknown>} */ (value)[part]
  }
  return value
}

/** Длинный текст (описание) в подсказке обрезается: целиком он виден в русской версии. */
export const HINT_CHARS = 600

/**
 * Текст для подсказки: без тегов HTML и знаков разметки сайта в начале строк, пробелы схлопнуты,
 * длинный — обрезан по слову с многоточием. Не строка или пусто — пустая строка.
 * @param {unknown} value
 */
export function hintText(value) {
  if (typeof value !== 'string') return ''
  const plain = value
    .replace(/<[^>]*>/g, ' ')
    .replace(/!\[([^\]]*)\]\([^)]*\)/g, '$1')
    .replace(/\[([^\]]*)\]\([^)]*\)/g, '$1')
    .split('\n')
    .map((line) => line.replace(/^\s*(#{2,3}|[-*•]|\d{1,2}[.)]|>)\s+/, '').trim())
    .filter(Boolean)
    .join('\n')
    .replace(/[ \t]+/g, ' ')
  if (plain.length <= HINT_CHARS) return plain
  const cut = plain.slice(0, HINT_CHARS)
  const space = cut.lastIndexOf(' ')
  return `${(space > HINT_CHARS / 2 ? cut.slice(0, space) : cut).trimEnd()}…`
}
