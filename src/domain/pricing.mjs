// Exact rational arithmetic: no binary floating-point money calculations.

/** Версия правила расчёта: хранится в снимке заказа. */
export const PRICE_RULE = 'KZT-unit-floor1000-v2'

/** Шаг округления цены за единицу, тенге (решение владельца 30.10.2026: 189 990 → 189 000). */
export const PRICE_STEP = 1000n

function decimal(value) {
  if (typeof value !== 'string' || !/^\d{1,12}(\.\d{1,6})?$/.test(value))
    throw new Error('Некорректное десятичное значение')
  const [whole, fraction = ''] = value.split('.')
  return [BigInt(whole + fraction), 10n ** BigInt(fraction.length)]
}
/** Половина и больше — вверх (HALF_UP): для НДС, выделяемого до 0,01 тенге. */
function round(n, d) {
  return (n * 2n + d) / (2n * d)
}
/** Вверх до целого тенге: для цен меньше шага, чтобы не получить 0. */
function ceil(n, d) {
  return (n + d - 1n) / d
}
/**
 * Цена за единицу на сайте: вниз до тысячи тенге (решение владельца 30.10.2026, вместо «вверх до
 * целого» от 08.10.2026). Меньше тысячи — вверх до целого тенге, иначе вышел бы ноль.
 * @param {bigint} n числитель точной цены, тенге
 * @param {bigint} d знаменатель
 */
function siteUnit(n, d) {
  const whole = n / d
  return whole >= PRICE_STEP ? (whole / PRICE_STEP) * PRICE_STEP : ceil(n, d)
}

/**
 * То же правило для цены в тиынах (строки прайса, которые называет Кадди).
 * @param {string} tiyn целое число тиынов строкой
 * @returns {string}
 */
export function siteTiyn(tiyn) {
  const value = BigInt(tiyn)
  const step = PRICE_STEP * 100n
  return (value >= step ? (value / step) * step : ((value + 99n) / 100n) * 100n).toString()
}
export function quote({
  amount,
  rate,
  sourceVat = '16',
  targetVat = '16',
  includesVat = false,
  quantity = 1,
}) {
  if (!Number.isInteger(quantity) || quantity < 1 || quantity > 999)
    throw new Error('Количество: от 1 до 999')
  if (typeof includesVat !== 'boolean') throw new Error('Некорректный флаг НДС')
  const [a, ad] = decimal(amount),
    [r, rd] = decimal(rate)
  const [s, sd] = decimal(sourceVat),
    [t, td] = decimal(targetVat)
  if (r === 0n || s > 100n * sd || t > 100n * td) throw new Error('Некорректный курс или НДС')
  let n = a * r * (100n * td + t),
    d = ad * rd * 100n * td
  if (includesVat) {
    n *= 100n * sd
    d *= 100n * sd + s
  }
  const unit = siteUnit(n, d),
    total = unit * BigInt(quantity)
  const vatMinor = round(total * t * 100n, 100n * td + t)
  return {
    unitKzt: unit.toString(),
    totalKzt: total.toString(),
    vatMinor: vatMinor.toString(),
    amount,
    rate,
    sourceVat,
    targetVat,
    includesVat,
    quantity,
    rule: PRICE_RULE,
  }
}
