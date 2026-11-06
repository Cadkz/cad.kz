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
