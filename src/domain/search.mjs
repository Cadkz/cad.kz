// @ts-check
/**
 * Простой поиск по каталогу без базы и сети: одинаково работает в тестах и на сервере.
 *
 * Понимает:
 * - регистр, «ё», знаки препинания: «ЛИРА-FEM» = «лира fem»;
 * - кириллицу вместо латиницы и на слух: «ревит» → Revit, «автокад», «овтокад» → AutoCAD;
 * - забытую раскладку: «фгещсфв» → autocad;
 * - опечатки: одна буква в словах от 4 букв, две — от 7 («автокат» → AutoCAD);
 * - начало слова: «скан» находит «сканер».
 * - другие названия товара из админки («акад» → AutoCAD): весят как название.
 */

/** @typedef {{ title: string, vendor?: string | null, aliases?: string | null, summary?: string | null, tasks?: string[] }} Searchable */

const CYR = 'абвгдеёжзийклмнопрстуфхцчшщъыьэюя'
const LAT = [
  'a',
  'b',
  'v',
  'g',
  'd',
  'e',
  'e',
  'zh',
  'z',
  'i',
  'y',
  'k',
  'l',
  'm',
  'n',
  'o',
  'p',
  'r',
  's',
  't',
  'u',
  'f',
  'h',
  'ts',
  'ch',
  'sh',
  'sch',
  '',
  'y',
  '',
  'e',
  'yu',
  'ya',
]
const KEYS_LAT = "qwertyuiop[]asdfghjkl;'zxcvbnm,.`"
const KEYS_CYR = 'йцукенгшщзхъфывапролджэячсмитьбюё'

/**
 * Нижний регистр, «ё» → «е», всё, кроме букв и цифр, — пробел.
 * @param {string} text
 */
export function normalize(text) {
  return text
    .toLowerCase()
    .replace(/ё/g, 'е')
    .replace(/[^\p{L}\p{N}]+/gu, ' ')
    .trim()
}

/**
 * Кириллица латиницей: «ревит» → «revit».
 * @param {string} word
 */
export function translit(word) {
  return [...word]
    .map((ch) => {
      const index = CYR.indexOf(ch)
      return index < 0 ? ch : LAT[index]
    })
    .join('')
}

/**
 * Слово, набранное не в той раскладке: «фгещсфв» → «autocad», «ht dbn» → «ре вит».
 * @param {string} word
 */
export function swapLayout(word) {
  const cyr = /[а-яё]/.test(word)
  const [from, to] = cyr ? [KEYS_CYR, KEYS_LAT] : [KEYS_LAT, KEYS_CYR]
  return [...word]
    .map((ch) => {
      const index = from.indexOf(ch)
      return index < 0 ? ch : to[index]
    })
    .join('')
}

/**
 * Расстояние Левенштейна с ранним выходом: больше limit — не считаем дальше.
 * @param {string} a
 * @param {string} b
 * @param {number} limit
 */
function distance(a, b, limit) {
  if (Math.abs(a.length - b.length) > limit) return limit + 1
  let prev = Array.from({ length: b.length + 1 }, (_, i) => i)
  for (let i = 1; i <= a.length; i++) {
    const row = [i]
    let best = i
    for (let j = 1; j <= b.length; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1
      row[j] = Math.min(prev[j] + 1, row[j - 1] + 1, prev[j - 1] + cost)
      best = Math.min(best, row[j])
    }
    if (best > limit) return limit + 1
    prev = row
  }
  return prev[b.length]
}

/** @param {number} length */
const allowedTypos = (length) => (length >= 7 ? 2 : length >= 4 ? 1 : 0)

/**
 * Звучание латиницей: убирает разницу между «AutoCAD» и «автокад» / «овтокад»
 * (au → av, c/q → k, w → v, y → i, o → a, двойные буквы — одна).
 * @param {string} latin
 */
export function sound(latin) {
  return latin
    .replace(/ph/g, 'f')
    .replace(/ch/g, '4')
    .replace(/sh/g, '6')
    .replace(/([ae])u/g, '$1v')
    .replace(/x/g, 'ks')
    .replace(/[cq]/g, 'k')
    .replace(/w/g, 'v')
    .replace(/y/g, 'i')
    .replace(/o/g, 'a')
    .replace(/(.)\1+/g, '$1')
}

/**
 * Насколько слово запроса совпадает со словом текста: 3 — точно, 2 — начало слова,
 * 1 — с опечаткой, 0 — нет.
 * @param {string} query
 * @param {string} word
 */
function wordScore(query, word) {
  if (word === query) return 3
  if (query.length >= 2 && word.startsWith(query)) return 2
  // Окончание: «курсы» → «курс», «сканеры» → «сканер», «плоттеров» → «плоттер».
  if (word.length >= 4 && query.length - word.length <= 2 && query.startsWith(word)) return 2
  const typos = allowedTypos(query.length)
  if (typos && distance(query, word, typos) <= typos) return 1
  return 0
}

/**
 * Лучшее совпадение слова запроса среди слов текста. Варианты: как есть и латиницей;
 * по звучанию — не выше «начала слова»; в другой раскладке — только точно или началом слова,
 * иначе случайные сочетания букв дают ложные находки.
 * @param {string} query
 * @param {{ word: string, sound: string }[]} words
 */
function bestScore(query, words) {
  const latin = translit(query)
  const heard = sound(latin)
  const swapped = swapLayout(query)
  const swappedLatin = translit(swapped)
  let best = 0
  for (const { word, sound: wordSound } of words) {
    best = Math.max(
      best,
      wordScore(query, word),
      wordScore(latin, word),
      Math.min(2, wordScore(heard, wordSound)),
    )
    for (const v of [swapped, swappedLatin]) {
      const score = v === query ? 0 : wordScore(v, word)
      if (score >= 2) best = Math.max(best, score)
    }
    if (best === 3) break
  }
  return best
}

/** @param {string} text */
const indexWords = (text) =>
  normalize(text)
    .split(' ')
    .filter(Boolean)
    .map((word) => ({ word, sound: sound(translit(word)) }))

/**
 * Найти товары: каждое слово запроса должно найтись в названии, производителе, анонсе или
 * задачах. Совпадения в названии весят больше; при равенстве — исходный порядок (топы первыми).
 * Опечатки — запасной путь: если есть точные находки, находки только с опечаткой не показываем
 * («скан» — сканеры, а не SCAD).
 * @template {Searchable} T
 * @param {T[]} items
 * @param {string} query
 * @param {number} [limit]
 * @param {boolean} [exactOnly] без находок с опечаткой (для коротких списков: производители, страницы)
 * @returns {T[]}
 */
export function searchItems(items, query, limit = 60, exactOnly = false) {
  const words = normalize(query).split(' ').filter(Boolean).slice(0, 6)
  if (!words.length) return []
  /** @type {{ item: T, score: number, exact: boolean, index: number }[]} */
  const found = []
  items.forEach((item, index) => {
    const title = indexWords(`${item.title} ${item.vendor ?? ''} ${item.aliases ?? ''}`)
    const rest = indexWords(`${item.summary ?? ''} ${(item.tasks ?? []).join(' ')}`)
    let score = 0
    let exact = true
    for (const word of words) {
      const inTitle = bestScore(word, title)
      const inRest = inTitle >= 2 ? 0 : bestScore(word, rest)
      const best = Math.max(inTitle, inRest)
      if (!best) return
      if (best < 2) exact = false
      score += inTitle >= inRest ? inTitle * 3 : inRest
    }
    found.push({ item, score, exact, index })
  })
  const anyExact = found.some((entry) => entry.exact)
  return found
    .filter((entry) => entry.exact || (!anyExact && !exactOnly))
    .sort((a, b) => b.score - a.score || a.index - b.index)
    .slice(0, limit)
    .map((entry) => entry.item)
}
