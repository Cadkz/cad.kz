// @ts-check
/**
 * Перевод интерфейса. Ключ — сам русский текст из кода, поэтому русская версия ничего не ищет,
 * а нет перевода — показывается русский (страница не ломается). Словари казахского
 * и английского — src/i18n/messages/<язык>.json, плоско «русский текст → перевод».
 * Подстановки: «Найдено: {count}» → translate(…, { count: 8 }).
 */

/** @typedef {Record<string, string>} Messages */

/**
 * @param {Messages | null | undefined} messages
 * @param {string} text
 * @param {Record<string, string | number>} [vars]
 */
export function translate(messages, text, vars) {
  const found = messages?.[text] || text
  if (!vars) return found
  return found.replace(/\{(\w+)\}/g, (whole, key) => (key in vars ? String(vars[key]) : whole))
}

/** @typedef {'ru' | 'kk' | 'en'} TLang */

/**
 * Форма слова по числу на языке страницы: в русском три формы, в английском две (1 и
 * остальное), в казахском после числа всегда одна. Возвращает переведённую форму.
 * @param {TLang} lang
 * @param {Messages | null | undefined} messages
 * @param {number} n
 * @param {string} one
 * @param {string} few
 * @param {string} many
 */
export function translatePlural(lang, messages, n, one, few, many) {
  if (lang === 'kk') return translate(messages, one)
  if (lang === 'en') return translate(messages, n === 1 ? one : many)
  const mod10 = n % 10
  const mod100 = n % 100
  if (mod10 === 1 && mod100 !== 11) return one
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)) return few
  return many
}

/**
 * Функция перевода страницы: t('Каталог'), t('Найдено: {n}', { n }), t.plural(3, 'товар',
 * 'товара', 'товаров'), t.lang — язык (для дат и чисел).
 * @param {TLang} lang
 * @param {Messages | null | undefined} messages
 */
export function makeT(lang, messages) {
  /** @param {string} text @param {Record<string, string | number>} [vars] */
  const t = (text, vars) => translate(messages, text, vars)
  return Object.assign(t, {
    lang,
    /** @param {number} n @param {string} one @param {string} few @param {string} many */
    plural: (n, one, few, many) => translatePlural(lang, messages, n, one, few, many),
  })
}
