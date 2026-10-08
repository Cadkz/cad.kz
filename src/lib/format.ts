/** Форматирование для интерфейса. Без серверных зависимостей. */

const money = new Intl.NumberFormat('ru-RU', { maximumFractionDigits: 0 })
const date = new Intl.DateTimeFormat('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' })

/** Целая сумма в тенге из строки сервера: «1 850 000 ₸». */
export function formatKzt(value: string) {
  return `${money.format(BigInt(value))} ₸`
}

/** Дата публикации: «23 июля 2026». */
export function formatDate(value: string) {
  return date.format(new Date(value)).replace(' г.', '')
}
