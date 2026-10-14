/**
 * Структура заголовков текста (правило владельца 14.10.2026): в оглавлении не больше пяти
 * пунктов. Оглавление — это заголовки разделов (h2). Всё мельче — подзаголовки внутри раздела
 * (h3), в оглавление они не попадают. Работает при выводе, текст в админке не меняется, поэтому
 * правило действует на все новости, статьи и акции сразу, в том числе перенесённые со старого
 * сайта, где в заголовки попадали абзацы, строки таблиц и списки характеристик.
 *
 * Как решаем:
 * 1. «Заголовок»-предложение (длиннее HEADING_LIMIT или с точкой в конце) и заголовок-ссылка
 *    («Зарегистрироваться») — обычный абзац.
 * 2. Если автор сам разметил подзаголовки «### », верим разметке: «## » — раздел, «### » —
 *    подзаголовок.
 * 3. Иначе (старый сайт отдал всё одним уровнем): заголовок, сразу за которым идёт другой
 *    заголовок, — название группы, это раздел; заголовки внутри групп и группа сразу после
 *    группы («Оборудование» → «Видеокарты» → «Quadro P600») — подзаголовки.
 *    Без групп все «## » — разделы.
 * 4. Подзаголовок, угаданный по короткой строке без точки, всегда h3.
 * 5. Разделов больше TOC_LIMIT — оглавление из пяти случайных пунктов из сорока вводило бы
 *    в заблуждение: все заголовки становятся подзаголовками, оглавления нет.
 */

/** Пунктов в оглавлении не больше. */
export const TOC_LIMIT = 5

/** Заголовок длиннее — это абзац, обёрнутый на старом сайте в заголовок. */
export const HEADING_LIMIT = 90

/**
 * Не заголовок, а текст: длинный, с точкой, «!», «?», «;» в конце или со ссылкой внутри.
 * @param {string} text
 */
export function isPlainText(text) {
  const clean = text.trim()
  return clean.length > HEADING_LIMIT || /[.!?;…]$/u.test(clean) || clean.includes('](')
}

/**
 * @typedef {{ heading: false }} OtherItem
 * @typedef {{ heading: true, text: string, level: 2 | 3, guess: boolean }} HeadingItem
 */

/**
 * Уровни заголовков текста.
 * @param {(OtherItem | HeadingItem)[]} items блоки текста по порядку; level — из разметки
 *   («## » — 2, «### » — 3), guess — подзаголовок угадан по короткой строке
 * @returns {(0 | 2 | 3 | null)[]} для заголовка — 2 (раздел), 3 (подзаголовок) или 0 (обычный
 *   абзац); для остальных блоков — null
 */
export function headingLevels(items) {
  /** @type {(0 | 2 | 3 | null)[]} */
  const levels = items.map((item) => {
    if (!item.heading) return null
    if (isPlainText(item.text)) return 0
    return item.guess ? 3 : item.level
  })
  const authored = items.some((item, i) => item.heading && !item.guess && levels[i] === 3)
  if (!authored) {
    // Группа — заголовок раздела, за которым сразу следует другой заголовок.
    /** @param {number} i */
    const isGroup = (i) => levels[i] === 2 && (levels[i + 1] === 2 || levels[i + 1] === 3)
    const first = levels.findIndex((_, i) => isGroup(i))
    if (first >= 0) {
      const groups = levels.map((_, i) => isGroup(i))
      for (let i = first; i < levels.length; i++)
        if (levels[i] === 2 && (!groups[i] || groups[i - 1])) levels[i] = 3
    }
  }
  const sections = levels.filter((level) => level === 2).length
  if (sections > TOC_LIMIT) return levels.map((level) => (level === 2 ? 3 : level))
  return levels
}

/**
 * Заголовок капсом со старого сайта («КЛЮЧЕВЫЕ ОСОБЕННОСТИ») → обычное написание. Названия не
 * трогаем: слова с латиницей и цифрами (BIM, GEO5), через дефис (ЛИРА-САПР, САПФИР-3D, АВС-4)
 * и заголовок из одного слова (МАГНУМ).
 * @param {string} text
 */
export function headingCase(text) {
  if (/[a-zа-яё]/u.test(text) || (text.match(/[А-ЯЁ]+/gu)?.length ?? 0) < 2) return text
  const lowered = text.replace(/[А-ЯЁ][А-ЯЁ-]*[\w-]*/gu, (word) =>
    /^[А-ЯЁ]+$/u.test(word) ? word.toLowerCase() : word,
  )
  return lowered.replace(/^([^\p{L}]*)(\p{Ll})/u, (_, mark, letter) => mark + letter.toUpperCase())
}
