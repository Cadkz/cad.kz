/**
 * Правила разделов каталога: по производителю, типу и словам в названии товар получает
 * основной и дополнительные разделы. Чистые функции без базы — их используют хуки CMS,
 * команда настройки каталога и тесты. Сами правила владелец ведёт в админке.
 *
 * Слова в названии: через запятую — подходит любое; «+» внутри — нужны все части
 * («project studio+фундамент»). Регистр не важен, ищется вхождение. Пусто — подходит любой товар.
 */

/**
 * @typedef {{ order: number, vendor: string | null, kind: string | null, words: string,
 *   main: string | null, extra: string[], retire: boolean, title?: string }} SectionRule
 * @typedef {{ title: string, vendor: string | null, kind: string }} RuleProduct
 */

const normalize = (value) =>
  String(value ?? '')
    .toLowerCase()
    .replace(/ё/g, 'е')
    .replace(/\s+/g, ' ')
    .trim()

/** Разбор поля «Слова в названии»: список вариантов, каждый — список обязательных частей. */
export function parseWords(words) {
  return String(words ?? '')
    .split(/[,;\n]/)
    .map((variant) => variant.split('+').map(normalize).filter(Boolean))
    .filter((parts) => parts.length > 0)
}

/** Подходит ли название под слова правила. Пустые слова подходят всегда. */
export function titleMatches(words, title) {
  const variants = parseWords(words)
  if (!variants.length) return true
  const text = normalize(title)
  return variants.some((parts) => parts.every((part) => text.includes(part)))
}

/**
 * Подходит ли правило товару.
 * @param {SectionRule} rule
 * @param {RuleProduct} product
 */
export function ruleMatches(rule, product) {
  if (rule.vendor && normalize(rule.vendor) !== normalize(product.vendor)) return false
  if (rule.kind && rule.kind !== product.kind) return false
  return titleMatches(rule.words, product.title)
}

/**
 * Первое подходящее правило по порядку проверки или null.
 * @param {SectionRule[]} rules
 * @param {RuleProduct} product
 * @returns {SectionRule | null}
 */
export function pickRule(rules, product) {
  const sorted = [...rules].sort((a, b) => a.order - b.order)
  return sorted.find((rule) => ruleMatches(rule, product)) ?? null
}

/**
 * Разделы товара по правилам: основной и дополнительные (без повторов), признак «снят с продажи».
 * null — ни одно правило не подошло (товар остаётся без раздела, его видно в списке товаров).
 * @param {SectionRule[]} rules
 * @param {RuleProduct} product
 * @returns {{ main: string | null, extra: string[], retire: boolean, rule: SectionRule } | null}
 */
export function sectionsByRules(rules, product) {
  const rule = pickRule(rules, product)
  if (!rule) return null
  const extra = [...new Set(rule.extra)].filter((item) => item && item !== rule.main)
  return { main: rule.main ?? null, extra, retire: Boolean(rule.retire), rule }
}

/** Все разделы товара одним списком: основной первым, без повторов. */
export function allSections(main, extra) {
  return [...new Set([main, ...(extra ?? [])].filter((item) => item != null && item !== ''))]
}
