// @ts-check
// Кнопки быстрых ответов под уточняющим вопросом Кадди (решение владельца 20.10.2026): клиент
// нажимает «Сваи» вместо того, чтобы печатать. Модель дописывает последней строкой ответа
// «Кнопки: Сваи | Осадка | Откос» (правило QUICK_REPLIES_RULE), сервер убирает строку из текста
// и отдаёт варианты отдельно. Файл подключается и на сервере, и в браузере.

/** Сколько кнопок можно показать под ответом и длина одной. */
export const QUICK_REPLY_LIMITS = /** @type {const} */ ({ min: 2, max: 4, chars: 40 })

/** Правило для модели: когда и как дописывать строку с кнопками. */
export const QUICK_REPLIES_RULE = `Кнопки ответа. Задаёшь уточняющий вопрос, на который клиент отвечает выбором из 2–4 коротких вариантов (что считаете — сваи, осадку или откос; только 2D или ещё 3D; 1 год или 3 года; полный AutoCAD или AutoCAD LT), — допиши последней отдельной строкой: «Кнопки: Сваи | Осадка | Откос». Сайт покажет варианты кнопками под ответом, клиент нажмёт вместо того, чтобы печатать; саму строку он не увидит, поэтому вопрос и варианты должны быть в тексте ответа. Вариант — 1–4 слова, как ответил бы клиент, с заглавной буквы, без точки и кавычек; «Другое» не добавляй — клиент может написать сам. Строку не пиши, когда вопроса нет, когда ответ открытый (имя, телефон, описание задачи своими словами) и когда вариантов больше четырёх. Строка «Кнопки:» — одна и только последней.`

/** Строка с кнопками: «Кнопки: А | Б | В» (модель иногда пишет «Варианты:»). */
const LINE = /^[ \t]*(?:кнопки|варианты)[ \t]*:[ \t]*(.*)$/i

/** Вариант без кавычек, маркеров списка и точки в конце. */
function cleanOption(/** @type {string} */ value) {
  return value
    .replace(/^[\s«"'„“*—–-]+/, '')
    .replace(/[\s»"'“”*.;,]+$/, '')
    .replace(/\s+/g, ' ')
}

/**
 * Ответ модели → текст без строки кнопок и сами кнопки. Строка убирается всегда, даже если
 * варианты негодные (слишком много, длинные) — тогда кнопок просто нет.
 * @param {string} text
 * @returns {{ text: string, replies: string[] }}
 */
export function splitQuickReplies(text) {
  const lines = text.replace(/\r\n?/g, '\n').split('\n')
  let index = lines.length - 1
  while (index >= 0 && !lines[index].trim()) index--
  const match = index >= 0 ? LINE.exec(lines[index]) : null
  const rest = match ? lines.slice(0, index).join('\n').trim() : ''
  // Без строки кнопок или ответ из одной этой строки — текст как есть.
  if (!match || !rest) return { text, replies: [] }
  const options = match[1]
    .split('|')
    .map(cleanOption)
    .filter(Boolean)
    .filter(
      (option, i, all) => all.findIndex((o) => o.toLowerCase() === option.toLowerCase()) === i,
    )
  const { min, max, chars } = QUICK_REPLY_LIMITS
  const fits =
    options.length >= min &&
    options.length <= max &&
    options.every((option) => option.length <= chars && /[\p{L}\p{N}]/u.test(option))
  return { text: rest, replies: fits ? options : [] }
}
