// @ts-check
/**
 * Простой поиск по каталогу без базы и сети: одинаково работает в тестах и на сервере.
 *
 * Понимает:
 * - регистр, «ё», знаки препинания: «ЛИРА-FEM» = «лира fem»;
 * - кириллицу вместо латиницы и на слух: «ревит» → Revit, «автокад», «овтокад» → AutoCAD,
 *   «скад офис» → SCAD Office;
 * - забытую раскладку: «фгещсфв» → autocad;
 * - опечатки: одна буква в словах от 4 букв, две — от 7 («автокат» → AutoCAD);
 * - начало слова и окончания: «скан» → «сканер», «вентиляции» → «вентиляция», «сетей» → «сети»;
 * - служебные слова не мешают: «программа для вентиляции» ищет «вентиляции», а «программа» и
 *   «для» только поднимают совпадения выше;
 * - продление: «обновить», «продлить» находят «Upgrade», «Subscription», «продление».
 *
 * Где ищет (по убыванию веса): название, производитель, другие названия из админки; разделы
 * каталога товара («Плоттеры», «3D-сканеры»); названия программ в подборе и семействе; анонс и
 * задачи; слова описания и характеристик. В составе и описании — только точно, без опечаток.
 * Если все слова запроса не нашлись ни у одного товара, показываются товары без одного слова
 * (partial): «плоттер А0» найдёт плоттеры, даже если «А0» нигде не написано.
 */

/**
 * @typedef {{ title: string, vendor?: string | null, aliases?: string | null,
 *   summary?: string | null, tasks?: string[], sections?: string[], parts?: string | null,
 *   keywords?: string | null }} Searchable
 * sections — названия разделов каталога, основной первым; parts — названия программ в составе
 * (варианты подбора, программы семейства); keywords — описание, характеристики, кнопка продления.
 */

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

/** Слова, которые ничего не уточняют: «для», «купить», «цена». Из запроса выбрасываются. */
const STOP = new Set(
  'для и в во на по с со к ко о об от до под из или а не как где что это the for and of in to with купить куплю цена цены ценой стоимость сколько стоит заказать скачать недорого дешево официальный официально казахстан казахстане рк kz кз астана алматы'.split(
    ' ',
  ),
)

/**
 * Необязательные слова: если нашлись — товар выше, не нашлись — не беда. Начало слова (основа):
 * «программа», «программное обеспечение», «лицензия», «версия», а также общие слова инженерных
 * задач — «расчёт», «проектирование»: в «расчёт фундаментов» главное — «фундаментов».
 * Форматы листа (А0–А4) тоже необязательны: в описании плоттера формат пишут не всегда.
 */
const SOFT = [
  'программ',
  'обеспечен',
  'софт',
  'лицензи',
  'верси',
  'приложени',
  'систем',
  'расчет',
  'расчит',
  'проектир',
  'моделир',
  'а0',
  'а1',
  'а2',
  'а3',
  'а4',
  'a0',
  'a1',
  'a2',
  'a3',
  'a4',
]

/**
 * Продление и обновление: любое такое слово запроса совпадает с любым из них в товаре.
 * Слова тоже необязательные: «продлить автокад» — это прежде всего AutoCAD.
 */
const RENEW = [
  'обнов',
  'продл',
  'подписк',
  'апгрейд',
  'upgrade',
  'upg',
  'subscription',
  'renew',
  'update',
]

/** Окончания, которые отрезаются от русских слов: «вентиляции» и «вентиляция» → «вентиляц». */
const ENDINGS = [
  'ениями',
  'ениях',
  'ением',
  'ения',
  'ение',
  'ений',
  'ании',
  'ания',
  'ание',
  'иями',
  'ями',
  'ами',
  'ого',
  'его',
  'ому',
  'ему',
  'ыми',
  'ими',
  'иях',
  'иям',
  'ией',
  'ием',
  'ить',
  'ать',
  'ять',
  'еть',
  'ов',
  'ев',
  'ей',
  'ой',
  'ий',
  'ый',
  'ая',
  'яя',
  'ое',
  'ее',
  'ые',
  'ие',
  'ых',
  'их',
  'ам',
  'ям',
  'ах',
  'ях',
  'ом',
  'ем',
  'ию',
  'ия',
  'ии',
  'ью',
  'а',
  'я',
  'ы',
  'и',
  'у',
  'ю',
  'е',
  'о',
  'ь',
  'й',
]

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
 * Основа русского слова: без одного окончания, не короче трёх букв. Латиница — как есть.
 * @param {string} word
 */
export function stem(word) {
  if (!/[а-я]/.test(word)) return word
  for (const ending of ENDINGS)
    if (word.endsWith(ending) && word.length - ending.length >= 3)
      return word.slice(0, -ending.length)
  return word
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
 * Звучание латиницей: убирает разницу между «AutoCAD» и «автокад» / «овтокад», «Office» и «офис»
 * (au → av, c перед e/i/y → s, иначе c/q → k, ts → s, w → v, y → i, o → a, двойные буквы — одна).
 * @param {string} latin
 */
export function sound(latin) {
  return latin
    .replace(/ph/g, 'f')
    .replace(/ch/g, '4')
    .replace(/sh/g, '6')
    .replace(/([ae])u/g, '$1v')
    .replace(/x/g, 'ks')
    .replace(/c(?=[eiy])/g, 's')
    .replace(/[cq]/g, 'k')
    .replace(/ts/g, 's')
    .replace(/w/g, 'v')
    .replace(/y/g, 'i')
    .replace(/o/g, 'a')
    .replace(/(.)\1+/g, '$1')
}

/**
 * @typedef {{ word: string, stem: string, sound: string }} IndexWord
 * @typedef {{ text: string, latin: string, heard: string, swapped: string, swappedLatin: string,
 *   stem: string, renew: boolean }} QueryWord
 */

/** @param {string} word @returns {IndexWord} */
const indexWord = (word) => ({ word, stem: stem(word), sound: sound(translit(word)) })

/** @param {string} text */
const indexWords = (text) => [...new Set(normalize(text).split(' ').filter(Boolean))].map(indexWord)

/** @param {string} word */
const isRenew = (word) => RENEW.some((root) => word.startsWith(root))

/** @param {string} text @returns {QueryWord} */
function queryWord(text) {
  const latin = translit(text)
  const swapped = swapLayout(text)
  return {
    text,
    latin,
    heard: sound(latin),
    swapped,
    swappedLatin: translit(swapped),
    stem: stem(text),
    renew: isRenew(text) || isRenew(latin),
  }
}

/**
 * Насколько слово запроса совпадает со словом текста: 3 — точно, 2 — начало слова или та же
 * основа, 1 — с опечаткой, 0 — нет. typos = false — без опечаток (для слов описания).
 * @param {string} query
 * @param {IndexWord} entry
 * @param {boolean} typos
 */
function wordScore(query, entry, typos = true) {
  const { word } = entry
  if (word === query) return 3
  if (query.length >= 2 && word.startsWith(query)) return 2
  // Окончание: «курсы» → «курс», «сканеры» → «сканер», «плоттеров» → «плоттер».
  if (word.length >= 4 && query.length - word.length <= 2 && query.startsWith(word)) return 2
  // Основа: «вентиляции» → «вентиляция», «сетей» → «сети», «программа» → «программное».
  const base = stem(query)
  if (base.length >= 3 && base !== query) {
    if (base === entry.stem) return 2
    if (base.length >= 5 && word.startsWith(base)) return 2
  }
  if (!typos) return 0
  const allowed = allowedTypos(query.length)
  if (allowed && distance(query, word, allowed) <= allowed) return 1
  return 0
}

/**
 * Лучшее совпадение слова запроса среди слов текста. Варианты: как есть и латиницей;
 * по звучанию — не выше «начала слова»; в другой раскладке — только точно или началом слова,
 * иначе случайные сочетания букв дают ложные находки. strict — без опечаток и звучания.
 * @param {QueryWord} query
 * @param {IndexWord[]} words
 * @param {boolean} [strict]
 */
function bestScore(query, words, strict = false) {
  let best = 0
  for (const entry of words) {
    if (query.renew && isRenew(entry.word)) return 2
    best = Math.max(
      best,
      wordScore(query.text, entry, !strict),
      wordScore(query.latin, entry, !strict),
    )
    if (!strict) {
      const heard = wordScore(query.heard, { word: entry.sound, stem: entry.sound, sound: '' })
      best = Math.max(best, Math.min(2, heard))
      for (const v of [query.swapped, query.swappedLatin]) {
        const score = v === query.text ? 0 : wordScore(v, entry)
        if (score >= 2) best = Math.max(best, score)
      }
    }
    if (best === 3) break
  }
  return best
}

/**
 * @typedef {{ title: IndexWord[], name: IndexWord[], sections: IndexWord[], main: IndexWord[],
 *   parts: IndexWord[], about: IndexWord[], keywords: IndexWord[] }} Prepared
 */

/** Разобранные слова товара: индекс сайта живёт минуту, разбирать заново на каждую букву незачем. */
const prepared = new WeakMap()

/** @param {Searchable} item @returns {Prepared} */
function prepare(item) {
  const known = prepared.get(item)
  if (known) return known
  const [mainSection = ''] = item.sections ?? []
  const result = {
    title: indexWords(item.title),
    name: indexWords(`${item.title} ${item.vendor ?? ''} ${item.aliases ?? ''}`),
    sections: indexWords((item.sections ?? []).join(' ')),
    main: indexWords(mainSection),
    parts: indexWords(item.parts ?? ''),
    about: indexWords(`${item.summary ?? ''} ${(item.tasks ?? []).join(' ')}`),
    keywords: indexWords(item.keywords ?? ''),
  }
  prepared.set(item, result)
  return result
}

/**
 * Совпадение слова запроса с товаром: очки и точность (без опечаток).
 * Название весит ×3, раздел ×3, программы в составе ×2 и только точно, анонс ×1, описание ×1 и
 * только точно. Совпал основной раздел товара — ещё +1.
 * @param {QueryWord} word
 * @param {Prepared} item
 */
function matchWord(word, item) {
  const found = matchPlace(word, item)
  // Основной раздел товара совпал со словом запроса — товар из этой категории, а не просто
  // упоминание: «плоттер» — сами плоттеры выше сканера «для плоттеров».
  if (found.score && bestScore(word, item.main, true) >= 2) found.score += 1
  return found
}

/**
 * Где нашлось слово запроса: очки и точность (без опечаток).
 * @param {QueryWord} word
 * @param {Prepared} item
 */
function matchPlace(word, item) {
  const inName = bestScore(word, item.name)
  if (inName >= 2) return { score: inName * 3, exact: true }
  const inSection = bestScore(word, item.sections, true)
  if (inSection >= 2) return { score: inSection * 3, exact: true }
  const inParts = bestScore(word, item.parts, true)
  if (inParts >= 2) return { score: inParts * 2, exact: true }
  const inAbout = bestScore(word, item.about)
  if (inAbout >= 2) return { score: inAbout, exact: true }
  const inKeywords = bestScore(word, item.keywords, true)
  if (inKeywords >= 2) return { score: 1, exact: true }
  // Только с опечаткой — в названии весит больше, чем в анонсе.
  if (inName) return { score: inName * 3, exact: false }
  if (inAbout) return { score: inAbout, exact: false }
  return { score: 0, exact: false }
}

/**
 * Запрос покрывает название целиком: «civil 3d» — сама программа Civil 3D, а не курс по ней.
 * @param {QueryWord[]} words
 * @param {Prepared} item
 */
function wholeTitle(words, item) {
  return (
    item.title.length > 0 &&
    item.title.every((entry) => words.some((word) => bestScore(word, [entry], true) >= 2))
  )
}

/**
 * Слова запроса: обязательные и необязательные («программа», «обновить»), без служебных.
 * Если обязательных нет («программа»), необязательные становятся обязательными.
 * @param {string} query
 */
export function queryWords(query) {
  const all = normalize(query).split(' ').filter(Boolean).slice(0, 8)
  const meaningful = all.filter((word) => !STOP.has(word))
  const words = meaningful.length ? meaningful : all
  const soft = words.filter((word) => SOFT.some((root) => word.startsWith(root)) || isRenew(word))
  const required = words.filter((word) => !soft.includes(word))
  return required.length ? { required, optional: soft } : { required: soft, optional: [] }
}

/**
 * Найти товары с пометкой partial — показаны товары, у которых нашлись не все слова запроса.
 * Каждое обязательное слово должно найтись в названии, разделе, анонсе или описании. Совпадения
 * в названии весят больше; при равенстве — исходный порядок (топы первыми). Опечатки — запасной
 * путь: если есть точные находки, находки только с опечаткой не показываем («скан» — сканеры,
 * а не SCAD).
 * @template {Searchable} T
 * @param {T[]} items
 * @param {string} query
 * @param {number} [limit]
 * @param {boolean} [exactOnly] без находок с опечаткой и без неполных (короткие списки:
 *   производители, разделы, страницы)
 * @returns {{ items: T[], partial: boolean }}
 */
export function searchDetailed(items, query, limit = 60, exactOnly = false) {
  const { required, optional } = queryWords(query)
  if (!required.length) return { items: [], partial: false }
  const must = required.map(queryWord)
  const may = optional.map(queryWord)
  /** @type {{ item: T, score: number, exact: boolean, missed: number, index: number }[]} */
  const found = []
  items.forEach((item, index) => {
    const words = prepare(item)
    let score = 0
    let exact = true
    let missed = 0
    for (const word of must) {
      const match = matchWord(word, words)
      if (!match.score) {
        missed += 1
        if (missed > 1) return
        continue
      }
      if (!match.exact) exact = false
      score += match.score
    }
    for (const word of may) {
      const match = matchWord(word, words)
      if (match.exact) score += Math.min(match.score, 3)
    }
    // Меньше очка: только порядок среди равных.
    if (score && wholeTitle([...must, ...may], words)) score += 0.9
    found.push({ item, score, exact, missed, index })
  })
  const full = found.filter((entry) => entry.missed === 0)
  // Без одного слова — только если запрос из двух и больше слов и полных находок нет.
  const partial = !full.length && must.length >= 2 && !exactOnly
  const pool = partial ? found.filter((entry) => entry.score > 0) : full
  const anyExact = pool.some((entry) => entry.exact)
  return {
    items: pool
      .filter((entry) => entry.exact || (!anyExact && !exactOnly))
      .sort((a, b) => b.score - a.score || a.index - b.index)
      .slice(0, limit)
      .map((entry) => entry.item),
    partial: partial && pool.length > 0,
  }
}

/**
 * Найти товары (см. searchDetailed): только список.
 * @template {Searchable} T
 * @param {T[]} items
 * @param {string} query
 * @param {number} [limit]
 * @param {boolean} [exactOnly]
 * @returns {T[]}
 */
export function searchItems(items, query, limit = 60, exactOnly = false) {
  return searchDetailed(items, query, limit, exactOnly).items
}
