// @ts-check
// Ссылки на списки админки с готовым фильтром: «Все в списке» в «Контроле качества» и на главной.
// Тесты — tests/quality.test.mjs.

/**
 * Параметры адреса в записи, которую понимает список Payload: where[or][0][and][1][status][equals]=…
 * @param {string} prefix
 * @param {unknown} value
 * @returns {string[]}
 */
function encode(prefix, value) {
  if (Array.isArray(value))
    return value.flatMap((item, index) => encode(`${prefix}[${index}]`, item))
  if (value !== null && typeof value === 'object')
    return Object.entries(value).flatMap(([key, item]) => encode(`${prefix}[${key}]`, item))
  return [
    `${encodeURIComponent(prefix).replace(/%5B/g, '[').replace(/%5D/g, ']')}=${encodeURIComponent(String(value))}`,
  ]
}

/**
 * Список коллекции с фильтром «все условия сразу» — так же, как его собирает сам Payload, поэтому
 * фильтр виден и правится в списке.
 * @param {string} collection
 * @param {Record<string, unknown>[]} conditions
 */
export function listHref(collection, conditions) {
  const base = `/admin/collections/${collection}`
  if (!conditions.length) return base
  return `${base}?${encode('where', { or: [{ and: conditions }] }).join('&')}`
}
