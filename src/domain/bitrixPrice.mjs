// Цены из выгрузки Битрикса в виде, который понимает src/domain/pricing.mjs.

/** Выше этой суммы в любой валюте цена считается заглушкой (на старом сайте есть 6 млрд тг). */
export const SUSPICIOUS_AMOUNT = 100_000_000n

const FORMATS = [
  // 69 300.00 руб.
  { re: /^(\d[\d ]*)\.(\d{2}) руб\.$/, currency: 'RUB', thousands: / /g },
  // 1 542 800,00 тг.
  { re: /^(\d[\d ]*),(\d{2}) тг\.$/, currency: 'KZT', thousands: / /g },
  // €7,100.00
  { re: /^€(\d[\d,]*)\.(\d{2})$/, currency: 'EUR', thousands: /,/g },
  // $1,743.00
  { re: /^\$(\d[\d,]*)\.(\d{2})$/, currency: 'USD', thousands: /,/g },
]

/**
 * «Розничная цена» из списка админки. Возвращает null для пустой ячейки,
 * { amount, currency } для цены и { error } для того, что не удалось разобрать.
 * Приставку «от » (минимальная цена у товара с предложениями) отбрасывает: решает вызывающий.
 */
export function parseBitrixPrice(raw) {
  const value = String(raw ?? '')
    .replace(/\s+/g, ' ')
    .trim()
    .replace(/^от /, '')
  if (!value) return null
  for (const { re, currency, thousands } of FORMATS) {
    const match = value.match(re)
    if (!match) continue
    const whole = BigInt(match[1].replace(thousands, ''))
    const amount = match[2] === '00' ? whole.toString() : `${whole}.${match[2]}`
    return { amount, currency }
  }
  return { error: value }
}

/** Цена пригодна для продажи: больше нуля и не заглушка. */
export function priceProblem(price) {
  if (!price || price.error) return null
  const whole = BigInt(price.amount.split('.')[0])
  if (whole === 0n && !/[1-9]/.test(price.amount)) return 'zero'
  if (whole >= SUSPICIOUS_AMOUNT) return 'suspicious'
  return null
}

/** «НДС 16% (по умолчанию)» → '16', «Без НДС» → '0', пусто → ставка магазина по умолчанию. */
export function parseVatRate(raw, fallback = '16') {
  const text = String(raw ?? '').trim()
  const match = text.match(/(\d+(?:[.,]\d+)?)\s*%/)
  if (match) return match[1].replace(',', '.')
  return /без/i.test(text) ? '0' : fallback
}

export const isYes = (value) => /^(да|y|yes)$/i.test(String(value ?? '').trim())
