// @ts-check
import { CELL_LIMIT, sameMarkup, TARGETS } from './translationTable.mjs'

/**
 * Словарь переводов характеристик и комплектаций (06.11.2026). Названия, группы и значения
 * характеристик, подписи комплектаций, условия лицензий и тексты подбора сильно повторяются
 * («Точность», «Масса», «1 год», «Бессрочная»), а код (факты, фильтры, Кадди, цены, Битрикс)
 * завязан на русские значения. Поэтому они не переводятся в каждом товаре: в базе остаётся
 * русский текст, а на /kk и /en он подменяется по точному совпадению из общего словаря.
 * Нет перевода — показывается русский.
 *
 * Строки словаря выгружаются в ту же таблицу «Переводы» с ключом `terms:<русский текст>`:
 * при загрузке по ключу находится (или создаётся) запись словаря.
 */

/** @typedef {import('./translationTable.mjs').TableRow} TableRow */
/** @typedef {import('./translationTable.mjs').IncomingRow} IncomingRow */
/** @typedef {import('./translationTable.mjs').TargetLang} TargetLang */

export const TERM_PREFIX = 'terms:'

/** Что это за текст: подписи для столбца «Что это», в порядке выгрузки. */
export const TERM_KINDS = /** @type {const} */ ({
  group: 'Группа характеристик',
  name: 'Характеристика',
  value: 'Значение характеристики',
  fact: 'Главный факт',
  configuration: 'Комплектация',
  license: 'Условия лицензии',
  step: 'Подбор: шаг',
  hint: 'Подбор: подсказка',
  option: 'Подбор: вариант',
  note: 'Подбор: пояснение',
  switch: 'Подбор: переключатель',
  switchValue: 'Подбор: значение переключателя',
})

/** @typedef {keyof typeof TERM_KINDS} TermKind */

/** Длиннее — это уже не подпись, а описание: такие тексты переводятся в самом товаре. */
export const TERM_MAX_LENGTH = 1000

/** Переводить есть что: в тексте есть русские буквы («600 dpi», «USB 3.0» — нет). */
const CYRILLIC = /[а-яё]/i

/** @param {unknown} text */
export function needsTerm(text) {
  return typeof text === 'string' && CYRILLIC.test(text) && text.trim().length <= TERM_MAX_LENGTH
}

/**
 * Сборщик текстов сайта для словаря: текст → вид, пояснение (у значения — название
 * характеристики), первый товар и сколько ещё раз встретился.
 * @param {(text: string) => boolean} [skip] уже переведено иначе (словари интерфейса)
 */
export function termCollector(skip = () => false) {
  /** @type {Map<string, { kind: TermKind, context: string | null, where: string, count: number }>} */
  const found = new Map()
  return {
    /**
     * @param {unknown} raw
     * @param {TermKind} kind
     * @param {string} where  товар, где встретился
     * @param {string | null} [context]
     */
    add(raw, kind, where, context = null) {
      if (!needsTerm(raw)) return
      const text = /** @type {string} */ (raw).trim()
      if (skip(text)) return
      const seen = found.get(text)
      if (seen) seen.count++
      else found.set(text, { kind, context, where, count: 1 })
    },
    /** Тексты по видам в порядке TERM_KINDS, внутри вида — в порядке появления. */
    list() {
      const order = Object.keys(TERM_KINDS)
      return [...found.entries()]
        .map(([text, info]) => ({ text, ...info }))
        .sort((a, b) => order.indexOf(a.kind) - order.indexOf(b.kind))
    },
  }
}

/**
 * @typedef {{ text: string, kind: TermKind, context: string | null, where: string, count: number }} Collected
 * @typedef {{ id?: number, kk: string, en: string }} Known
 */

/** @param {Collected} item */
function what(item) {
  const context = item.context ? ` «${item.context}»` : ''
  const more = item.count > 1 ? ` и ещё ${item.count - 1}` : ''
  return `${TERM_KINDS[item.kind]}${context} · ${item.where}${more}`
}

/**
 * Строки таблицы словаря: по одной строке в группе (части делятся по строкам), с текущими
 * переводами из словаря.
 * @param {Collected[]} collected
 * @param {Map<string, Known>} dictionary
 * @returns {TableRow[][]}
 */
export function termGroups(collected, dictionary) {
  return collected.map((item) => {
    const known = dictionary.get(item.text)
    return [
      {
        key: `${TERM_PREFIX}${item.text}`,
        what: what(item),
        ru: item.text,
        kk: known?.kk ?? '',
        en: known?.en ?? '',
      },
    ]
  })
}

/** @param {string} key */
export const isTermKey = (key) => key.startsWith(TERM_PREFIX) && key.length > TERM_PREFIX.length

/**
 * @typedef {{ ru: string, id?: number, data: Partial<Record<TargetLang, string>> }} TermUpdate
 * @typedef {{ key: string, lang: TargetLang, reason: string }} Problem
 */

/**
 * Изменения словаря из загруженной таблицы. Записываются только тексты, которые есть на сайте
 * сейчас или уже есть в словаре: иначе ключ испорчен (ChatGPT поправил русский текст).
 * Пустая ячейка ничего не стирает, совпадающая с текущим переводом — не изменение.
 * @param {IncomingRow[]} incoming строки с ключами terms:
 * @param {Map<string, Known>} known словарь и тексты сайта (без id — ещё нет в словаре)
 * @returns {{ updates: TermUpdate[], problems: Problem[], unchanged: number }}
 */
export function planTermUpdates(incoming, known) {
  /** @type {Map<string, TermUpdate>} */
  const byText = new Map()
  /** @type {Problem[]} */
  const problems = []
  let unchanged = 0
  for (const item of incoming) {
    if (!isTermKey(item.key)) continue
    const ru = item.key.slice(TERM_PREFIX.length).trim()
    const current = known.get(ru)
    if (!current) {
      problems.push({ key: item.key, lang: 'kk', reason: 'русский текст не найден на сайте' })
      continue
    }
    for (const lang of TARGETS) {
      const text = item[lang]
      if (!text) continue
      if (text === current[lang]) {
        unchanged++
        continue
      }
      if (text.length > Math.min(CELL_LIMIT, TERM_MAX_LENGTH * 3)) {
        problems.push({ key: item.key, lang, reason: 'слишком длинный текст' })
        continue
      }
      if (!sameMarkup(ru, text)) {
        problems.push({ key: item.key, lang, reason: 'разметка не совпадает с русской' })
        continue
      }
      let update = byText.get(ru)
      if (!update) {
        update = { ru, ...(current.id != null && { id: current.id }), data: {} }
        byText.set(ru, update)
      }
      update.data[lang] = text
    }
  }
  return { updates: [...byText.values()], problems, unchanged }
}

/**
 * Перевод по словарю: точное совпадение, иначе исходный текст.
 * @param {Map<string, string> | null} dictionary
 * @returns {(text: string) => string}
 */
export function termTranslator(dictionary) {
  if (!dictionary?.size) return (text) => text
  return (text) => dictionary.get(text.trim()) ?? text
}

/**
 * Характеристики на языке страницы: группа, название и значение — по словарю.
 * @template {{ group: string | null, name: string, value: string }} S
 * @param {S[]} specs
 * @param {(text: string) => string} tr
 * @returns {S[]}
 */
export function localizeSpecs(specs, tr) {
  return specs.map((spec) => ({
    ...spec,
    group: spec.group ? tr(spec.group) : spec.group,
    name: tr(spec.name),
    value: tr(spec.value),
  }))
}

/**
 * Тексты подбора, которые видит покупатель: переключатели, шаги, варианты и пояснения.
 * @param {import('./picker.mjs').PickerView} view
 * @returns {{ text: string, kind: TermKind }[]}
 */
export function pickerStrings(view) {
  /** @type {{ text: string | null | undefined, kind: TermKind }[]} */
  const list = []
  for (const sw of view.switches) {
    list.push({ text: sw.title, kind: 'switch' })
    for (const option of sw.options) {
      list.push({ text: option.value, kind: 'switchValue' })
      list.push({ text: option.note, kind: 'note' })
    }
  }
  for (const step of view.steps) {
    list.push({ text: step.title, kind: 'step' })
    list.push({ text: step.hint, kind: 'hint' })
    for (const item of step.items) {
      list.push({ text: item.label, kind: 'option' })
      list.push({ text: item.note, kind: 'note' })
    }
  }
  return list.filter(
    /** @returns {entry is { text: string, kind: TermKind }} */ (entry) => Boolean(entry.text),
  )
}

/**
 * Переводы текстов подбора для страницы: только те, что есть в словаре. Данные подбора остаются
 * русскими — по ним сверяются переключатели и уходит заявка менеджеру; покупатель видит перевод.
 * @param {import('./picker.mjs').PickerView} view
 * @param {(text: string) => string} tr
 * @returns {Record<string, string>}
 */
export function pickerTexts(view, tr) {
  /** @type {Record<string, string>} */
  const texts = {}
  for (const { text } of pickerStrings(view)) {
    const translated = tr(text)
    if (translated !== text) texts[text] = translated
  }
  return texts
}

/** Столько строк словаря записывается за один запрос записи (записи лёгкие, без хуков товара). */
export const TERMS_PER_REQUEST = 100
