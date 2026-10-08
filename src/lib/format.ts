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

/** Целая сумма в тенге из строки сервера: «1 850 000 ₸». */
export function formatKzt(value: string) {
  return `${money.format(BigInt(value))} ₸`
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
