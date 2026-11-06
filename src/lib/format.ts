/** Форматирование для интерфейса. Без серверных зависимостей. */

const money = new Intl.NumberFormat('ru-RU', { maximumFractionDigits: 0 })

/** Язык дат: русский по умолчанию, казахский и английский — на своих страницах. */
type DateLang = 'ru' | 'kk' | 'en'
const DATE_LOCALES: Record<DateLang, string> = { ru: 'ru-RU', kk: 'kk-KZ', en: 'en-GB' }

/** Перевод подписи «по запросу» и т. п.; без него — русский текст. */
type Tr = (text: string, vars?: Record<string, string | number>) => string
const same: Tr = (text, vars) =>
  vars
    ? text.replace(/\{(\w+)\}/g, (whole, key) => (key in vars ? String(vars[key]) : whole))
    : text

const formatters = new Map<string, Intl.DateTimeFormat>()
function formatter(lang: DateLang, kind: string, options: Intl.DateTimeFormatOptions) {
  const key = `${lang}:${kind}`
  let found = formatters.get(key)
  if (!found) {
    found = new Intl.DateTimeFormat(DATE_LOCALES[lang], options)
    formatters.set(key, found)
  }
  return found
}
const dateOptions = { day: 'numeric', month: 'long', year: 'numeric' } as const
// Время по Казахстану (UTC+5). Фиксированное смещение не зависит от версии базы часовых поясов.
const kazakhstanDay = {
  day: 'numeric',
  month: 'long',
  year: 'numeric',
  timeZone: 'Etc/GMT-5',
} as const
const dateTimeOptions = { ...kazakhstanDay, hour: '2-digit', minute: '2-digit' } as const

const shortDateTime = new Intl.DateTimeFormat('ru-RU', {
  day: '2-digit',
  month: '2-digit',
  year: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
  timeZone: 'Etc/GMT-5',
})

/** Дата и время по Казахстану коротко, как в списках админки: «23.10.2026 16:49». */
export function formatStamp(value: string) {
  return shortDateTime.format(new Date(value)).replace(',', '')
}

/** Целая сумма в тенге из строки сервера: «1 850 000 ₸». */
export function formatKzt(value: string) {
  return `${money.format(BigInt(value))} ₸`
}

/**
 * Итог корзины или заказа: позиции по запросу в сумму не входят — «по запросу» или
 * «1 200 000 ₸ + по запросу», если есть и те, и другие.
 */
export function totalKzt(value: string, withRequests: boolean, t: Tr = same) {
  if (!withRequests) return formatKzt(value)
  return BigInt(value) > 0n ? t('{sum} + по запросу', { sum: formatKzt(value) }) : t('По запросу')
}

/**
 * Итог корзины со строками-запросами: «от …», если у каждой есть цена «от» (замечание владельца
 * 03.11.2026), иначе «от … + по запросу». Без запросов — точная сумма.
 */
export function cartTotal(
  quote: { totalKzt: string; fromTotalKzt: string; fromComplete: boolean },
  withRequests: boolean,
  t: Tr = same,
) {
  if (!withRequests) return formatKzt(quote.totalKzt)
  if (BigInt(quote.fromTotalKzt) === 0n) return t('По запросу')
  const sum = formatKzt(quote.fromTotalKzt)
  return quote.fromComplete ? t('от {sum}', { sum }) : t('от {sum} + по запросу', { sum })
}

/** Цена строки корзины или заказа: у строки-запроса цены нет — «по запросу». */
export function lineKzt(value: string, t: Tr = same) {
  return value ? formatKzt(value) : t('по запросу')
}

/** Дата публикации: «23 июля 2026». */
export function formatDate(value: string, lang: DateLang = 'ru') {
  return formatter(lang, 'date', dateOptions).format(new Date(value)).replace(' г.', '')
}

/** Дата по Казахстану: «1 октября 2026». */
export function formatDay(value: string, lang: DateLang = 'ru') {
  return formatter(lang, 'day', kazakhstanDay).format(new Date(value)).replace(' г.', '')
}

/** Дата и время по Казахстану: «8 октября 2026, 15:30». */
export function formatDateTime(value: string, lang: DateLang = 'ru') {
  return formatter(lang, 'dateTime', dateTimeOptions).format(new Date(value)).replace(' г.,', ',')
}

/** Сумма в тиынах (сотых долях тенге) из строки сервера: «1 234,56 ₸». */
export function formatKztMinor(value: string) {
  const minor = BigInt(value)
  const fraction = (minor % 100n).toString().padStart(2, '0')
  return `${money.format(minor / 100n)},${fraction} ₸`
}

/** Цена в исходной валюте, как её хранит база («1145337.6»), для глаз: «1 145 337,6». */
export function formatAmount(value: string) {
  const [whole, fraction] = value.split('.')
  const grouped = whole.replace(/\B(?=(\d{3})+(?!\d))/g, ' ')
  return fraction ? `${grouped},${fraction}` : grouped
}
