// @ts-check
/**
 * Чистка текстов карточек, перенесённых со старого сайта (аудит ChatGPT №2, 11.10.2026).
 * Чистые функции без базы: их применяет настройка catalog-setup:cards-v1 (src/lib/cardsSetup.ts).
 *
 * - Буквы-двойники внутри слова: «AutoСAD» с русской С, «чaca» с латинскими a и c, «RС+».
 *   Поиск такие слова не находит, а читатель не видит разницы. Слово приводится к одной азбуке.
 * - Склеенные слова: «AutoCADArchitecture», «иTechnologiCS», «работы.Выгодная».
 * - Штамп «Выгодная цена в интернет-магазине CAD.kz» — не про товар, убирается.
 * - Повторы строк в таблицах сравнения (ЛИРА: «РСУ» в двух строках подряд).
 */

const LAT_TO_CYR = {
  A: 'А',
  B: 'В',
  C: 'С',
  E: 'Е',
  H: 'Н',
  K: 'К',
  M: 'М',
  O: 'О',
  P: 'Р',
  T: 'Т',
  X: 'Х',
  Y: 'У',
  a: 'а',
  c: 'с',
  e: 'е',
  k: 'к',
  o: 'о',
  p: 'р',
  x: 'х',
  y: 'у',
}
/** @type {Record<string, string>} */
const CYR_TO_LAT = Object.fromEntries(Object.entries(LAT_TO_CYR).map(([lat, cyr]) => [cyr, lat]))
/** @type {Record<string, string>} */
const LAT_MAP = LAT_TO_CYR

const isCyr = (/** @type {string} */ ch) => /[а-яё]/i.test(ch)
const isLat = (/** @type {string} */ ch) => /[a-z]/i.test(ch)

/**
 * Какой азбуки в тексте больше: по ней решаются слова только из букв-двойников («ЕH», «Уpo»).
 * @param {string} text
 * @returns {'cyr' | 'lat' | null}
 */
function mainScript(text) {
  const cyr = (text.match(/[а-яё]/gi) ?? []).length
  const lat = (text.match(/[a-z]/gi) ?? []).length
  return cyr > lat ? 'cyr' : lat > cyr ? 'lat' : null
}

/**
 * Слово из двух азбук → одна азбука. Если в слове есть буквы, которых нет в другой азбуке
 * («ч», «u»), побеждает их азбука; если только двойники — азбука всего текста. Если в слове
 * настоящие буквы обеих азбук («PDMП»), это склейка, слово не трогаем.
 * @param {string} word
 * @param {'cyr' | 'lat' | null} fallback
 */
function oneScript(word, fallback) {
  const chars = [...word]
  if (!chars.some(isCyr) || !chars.some(isLat)) return word
  const ownCyr = chars.filter((ch) => isCyr(ch) && !(ch in CYR_TO_LAT)).length
  const ownLat = chars.filter((ch) => isLat(ch) && !(ch in LAT_MAP)).length
  let target = ownCyr && !ownLat ? 'cyr' : ownLat && !ownCyr ? 'lat' : null
  if (!ownCyr && !ownLat) target = fallback
  if (target === 'cyr') return chars.map((ch) => LAT_MAP[ch] ?? ch).join('')
  if (target === 'lat') return chars.map((ch) => CYR_TO_LAT[ch] ?? ch).join('')
  return word
}

/**
 * Буквы-двойники внутри слов.
 * @param {string} text
 */
export function fixMixedScripts(text) {
  const fallback = mainScript(text)
  return text.replace(/\p{L}+/gu, (word) => oneScript(word, fallback))
}

/**
 * Склеенные слова и пропущенные пробелы.
 * @param {string} text
 */
export function fixSpacing(text) {
  return (
    text
      // «AutoCADArchitecture» → «AutoCAD Architecture», «MentalRay» → «Mental Ray».
      .replace(/\bAutoCAD(?=[A-Z])/g, 'AutoCAD ')
      .replace(/\bMentalRay\b/g, 'Mental Ray')
      // «иTechnologiCS» → «и TechnologiCS»: русский предлог или союз перед латинским словом.
      .replace(/(^|[^\p{L}])([иваскуо])(?=[A-Z][a-zA-Z])/gu, '$1$2 ')
      // «работы.Выгодная» → «работы. Выгодная».
      .replace(/([а-яё])([.,;:!?])([А-ЯЁA-Z][а-яёa-z])/g, '$1$2 $3')
  )
}

/**
 * Штамп интернет-магазина: предложение «Выгодная цена в интернет-магазине CAD.kz» не про товар.
 * @param {string} text
 */
export function removeShopStamp(text) {
  return text
    .replace(/[ \t]*[^.!?\n]*в интернет-магазине CAD\.kz\.?/g, '')
    .replace(/\n{3,}/g, '\n\n')
    .trim()
}

/**
 * Повтор строки таблицы сравнения («Расчетные сочетания усилий (РСУ) — ✓ — ✓» дважды): вторая
 * такая же строка убирается. Обычные абзацы не трогаем — только строки с « — ✓/✅».
 * @param {string} text
 */
export function dedupeTableRows(text) {
  const seen = new Set()
  return text
    .split('\n')
    .filter((line) => {
      if (!/ — [✓✅]/.test(line)) return true
      const key = line.replace(/\s+/g, ' ').trim()
      if (seen.has(key)) return false
      seen.add(key)
      return true
    })
    .join('\n')
}

/**
 * Все правила для текста карточки (описание, анонс, SEO, вопросы).
 * @param {string} text
 */
export function cleanCardText(text) {
  return dedupeTableRows(removeShopStamp(fixSpacing(fixMixedScripts(text))))
}

/**
 * Для названий и коротких строк: без штампа и таблиц, только буквы и пробелы.
 * @param {string} text
 */
export function cleanTitle(text) {
  return fixSpacing(fixMixedScripts(text))
}

/**
 * Точечные правки по аудиту: устаревшие сведения в описаниях. [что найти, на что заменить].
 * Сверено: системные требования GEO5 2026 — finesoftware.eu (страница демоверсии, 06.11.2025);
 * Artec Studio 20 — artec3d.com; Revit давно рендерит без Mental Ray (встроенная визуализация).
 * @type {[string | RegExp, string][]}
 */
export const CARD_EDITS = [
  [
    'Системные требования для GEO5, включая специализированные инструменты',
    'Системные требования GEO5 2026',
  ],
  [
    'Операционная система — Microsoft Windows 10',
    'Операционная система — Windows 11 или Windows 10 (последняя версия)',
  ],
  [
    'Монитор — Минимальное разрешение 1024×768 пикселей',
    'Монитор — разрешение от 1920×1080 пикселей (при масштабе 100 %)',
  ],
  [
    'Графический адаптер — Поддержка OpenGL 3.3',
    'Графический адаптер — поддержка OpenGL 4.6 (минимум 3.3)\n\nОперативная память — от 16 ГБ\n\nИнтернет — нужен для работы лицензии',
  ],
  [
    'Система рендеринга Mental Ray позволяет добиться фотореалистичной визуализации',
    'Встроенная визуализация позволяет добиться фотореалистичных изображений',
  ],
  [/Artec Studio 19\b/g, 'Artec Studio 20'],
]

/**
 * Точечные правки по списку CARD_EDITS.
 * @param {string} text
 */
export function applyCardEdits(text) {
  let result = text
  for (const [find, replace] of CARD_EDITS)
    result =
      typeof find === 'string' ? result.split(find).join(replace) : result.replace(find, replace)
  return result
}
