/** Форматирование для интерфейса. Без серверных зависимостей. */

const money = new Intl.NumberFormat('ru-RU', { maximumFractionDigits: 0 })
const date = new Intl.DateTimeFormat('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' })
// Время по Казахстану (UTC+5). Фиксированное смещение не зависит от версии базы часовых поясов.
const kazakhstanDay = {
  day: 'numeric',
  month: 'long',
  year: 'numeric',
  timeZone: 'Etc/GMT-5',
} as const
const day = new Intl.DateTimeFormat('ru-RU', kazakhstanDay)
const dateTime = new Intl.DateTimeFormat('ru-RU', {
  ...kazakhstanDay,
  hour: '2-digit',
  minute: '2-digit',
})

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
export function totalKzt(value: string, withRequests: boolean) {
  if (!withRequests) return formatKzt(value)
  return BigInt(value) > 0n ? `${formatKzt(value)} + по запросу` : 'По запросу'
}

/** Цена строки корзины или заказа: у строки-запроса цены нет — «по запросу». */
export function lineKzt(value: string) {
  return value ? formatKzt(value) : 'по запросу'
}

/** Дата публикации: «23 июля 2026». */
export function formatDate(value: string) {
  return date.format(new Date(value)).replace(' г.', '')
}

/** Дата по Казахстану: «1 октября 2026». */
export function formatDay(value: string) {
  return day.format(new Date(value)).replace(' г.', '')
}

/** Дата и время по Казахстану: «8 октября 2026, 15:30». */
export function formatDateTime(value: string) {
  return dateTime.format(new Date(value)).replace(' г.,', ',')
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
