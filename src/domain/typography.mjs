/**
 * Типографика длинных текстов (правило сайта, решение владельца 13.10.2026): в абзаце не больше
 * 4–5 строк, нумерованные шаги — списком, «Подпись: значение» — таблицей, короткая строка без
 * точки перед текстом — подзаголовком. Работает при выводе, текст в админке не меняется,
 * поэтому правило действует на все страницы, новости и статьи сразу.
 */

/**
 * Предел абзаца в знаках: строка шаблона «Чтение» (--measure 720 px) вмещает ~90 знаков,
 * 5 строк — ~450. Длиннее — делим по предложениям на части не больше SOFT_LIMIT.
 */
export const PARAGRAPH_LIMIT = 450
const SOFT_LIMIT = 360
const MIN_PART = 140

/** Конец предложения: точка, ! или ?, пробел и заглавная буква, кавычка или цифра. */
const SENTENCE = /(?<=[.!?…»)])\s+(?=[А-ЯЁA-Z«"\d])/u

/** Сокращения, после которых точка не конец предложения. */
const ABBREVIATIONS =
  /(?:^|\s)(?:т\.\s?е|т\.\s?к|т\.\s?п|т\.\s?д|др|пр|г|ул|д|им|см|стр|рис|тыс|млн|руб|тг|напр|ок|кв|корп|оф)\.$/iu

/** Предложения абзаца. Точку после сокращения («ул.», «т. е.») концом не считаем. */
export function sentences(text) {
  const parts = text.split(SENTENCE)
  const result = []
  for (const part of parts) {
    const previous = result.at(-1)
    if (previous !== undefined && ABBREVIATIONS.test(previous))
      result[result.length - 1] = `${previous} ${part}`
    else result.push(part)
  }
  return result
}

/**
 * Длинный абзац → несколько абзацев по 4–5 строк. Делим только между предложениями;
 * одно огромное предложение остаётся как есть. Короткий хвост присоединяется к предыдущей части.
 * @param {string} text
 * @returns {string[]}
 */
export function splitParagraph(text) {
  if (text.length <= PARAGRAPH_LIMIT) return [text]
  const parts = []
  let current = ''
  for (const sentence of sentences(text)) {
    if (
      current &&
      current.length >= MIN_PART &&
      current.length + sentence.length + 1 > SOFT_LIMIT
    ) {
      parts.push(current)
      current = sentence
    } else current = current ? `${current} ${sentence}` : sentence
  }
  if (current) {
    const last = parts.at(-1)
    if (
      last !== undefined &&
      current.length < MIN_PART &&
      last.length + current.length < PARAGRAPH_LIMIT + MIN_PART
    )
      parts[parts.length - 1] = `${last} ${current}`
    else parts.push(current)
  }
  return parts
}

/** Номер шага «1. », «2) » перед текстом с заглавной буквы или кавычки. */
const STEP = /(?:^|\s)(\d{1,2})[.)]\s+(?=[А-ЯЁA-Z«"])/gu

/**
 * Нумерованные шаги, набранные в строку: «Как купить 1. Выберите… 2. В корзине…» →
 * вступление и пункты. Только если номера идут подряд с 1 и шагов хотя бы два.
 * @param {string} text
 * @returns {{ intro: string, items: string[] } | null}
 */
export function inlineSteps(text) {
  const marks = []
  let expected = 1
  for (const match of text.matchAll(STEP)) {
    if (Number(match[1]) !== expected) continue
    const index = match.index ?? 0
    const lead = match[0].length - match[0].trimStart().length
    marks.push({ start: index + lead, end: index + match[0].length })
    expected++
  }
  if (marks.length < 2) return null
  const intro = text.slice(0, marks[0].start).trim()
  const items = marks.map((mark, i) =>
    text.slice(mark.end, marks[i + 1]?.start ?? text.length).trim(),
  )
  if (items.some((item) => !item)) return null
  return { intro, items }
}

/** «Подпись: значение» — подпись короткая, без точки внутри; значение может быть пустым. */
const FIELD = /^([^:.!?]{2,70}):\s*(.*)$/u

/**
 * Строки вида «БИН: 123», «Банк: …» (реквизиты, условия) → пары подпись/значение. Строка
 * «Банковские реквизиты:» без значения — заголовок группы. Не меньше двух пар со значением,
 * и все строки — пары; иначе это обычный текст.
 * @param {string[]} lines
 * @returns {{ label: string, value: string }[] | null}
 */
export function fieldLines(lines) {
  if (lines.length < 2) return null
  const fields = []
  for (const line of lines) {
    const field = fieldLine(line)
    if (!field) return null
    fields.push(field)
  }
  return fields.filter((field) => field.value).length >= 2 ? fields : null
}

/**
 * Одна строка «Подпись: значение» или null. Нужна и для реквизитов, где каждая строка
 * со старого сайта пришла отдельным абзацем.
 * @param {string} line
 * @returns {{ label: string, value: string } | null}
 */
export function fieldLine(line) {
  const match = FIELD.exec(line.replace(/\*\*/g, '').trim())
  return match ? { label: (match[1] ?? '').trim(), value: (match[2] ?? '').trim() } : null
}

/**
 * Короткая строка без знака в конце перед текстом («Оплата», «Сроки доставки») — подзаголовок.
 * @param {string} text
 */
export function looksLikeHeading(text) {
  const clean = text.trim()
  return (
    clean.length >= 3 &&
    clean.length <= 48 &&
    !/[.,;:!?…]$/u.test(clean) &&
    !clean.includes('](') &&
    /^[А-ЯЁA-Z«"]/u.test(clean)
  )
}
