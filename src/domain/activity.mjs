// Журнал важных действий: виды действий и тексты записей. Без зависимостей от Payload,
// чтобы тексты проверялись тестами (tests/adminQueue.test.mjs).

/** Виды действий: значение в базе и подпись в админке. Новый вид — только в конец списка. */
export const ACTIVITY_ACTIONS = [
  { value: 'rate', label: 'Курс валюты' },
  { value: 'vat', label: 'НДС' },
  { value: 'price-list', label: 'Загрузка прайса' },
  { value: 'import', label: 'Импорт из Битрикса' },
  { value: 'crm', label: 'Передача в CRM' },
  { value: 'delete', label: 'Удаление' },
  { value: 'users', label: 'Пользователи' },
  { value: 'kaddi', label: 'Прайс и база Кадди' },
  { value: 'prices', label: 'Цены таблицей' },
]

/** Подпись вида действия для списка на главной админки. */
export function actionLabel(value) {
  return ACTIVITY_ACTIONS.find((action) => action.value === value)?.label ?? value
}

/** Дата «1.10.2026» по Казахстану (UTC+5) — в текстах журнала. */
export function shortDate(value) {
  const day = new Date(new Date(value).getTime() + 5 * 3_600_000)
  return `${day.getUTCDate()}.${String(day.getUTCMonth() + 1).padStart(2, '0')}.${day.getUTCFullYear()}`
}

/**
 * Курс: «USD: 550 ₸ с 1.10.2026 (было 540 ₸)». previous — прежний курс этой валюты или null.
 * @param {{ currency: string, kztPerUnit: string, effectiveAt: string }} rate
 * @param {string | null} previous
 */
export function rateSummary(rate, previous) {
  const was = previous && previous !== rate.kztPerUnit ? ` (было ${previous} ₸)` : ''
  return `${rate.currency}: ${rate.kztPerUnit} ₸ с ${shortDate(rate.effectiveAt)}${was}`
}

/** НДС: «НДС 16 % (было 12 %)». */
export function vatSummary(vat, previous) {
  const was = previous && previous !== vat ? ` (было ${previous} %)` : ''
  return `НДС ${vat} %${was}`
}

/** Прайс: «Прайс SCAD.xlsx: изменено цен 12, без изменений 30, не найдено 2». */
export function priceListSummary({ file, changed, same, missing }) {
  const name = file ? `Прайс ${file}` : 'Прайс'
  return `${name}: изменено цен ${changed}, без изменений ${same}, не найдено ${missing}`
}

const CRM_STATES = {
  sent: 'передано в CRM',
  failed: 'не передано в CRM, будет повтор',
  dead: 'не передано в CRM, попытки закончились',
}

/**
 * Передача в CRM: запись только при смене состояния на «отправлено» или ошибку.
 * Возвращает null, если записывать нечего (то же состояние, ожидание, демо).
 * @param {{ state: string, lastError?: string | null }} delivery
 * @param {string | null | undefined} previousState
 * @param {string} subject «Заказ 2026-0001» или «Заявка Z-0001»
 */
export function crmSummary(delivery, previousState, subject) {
  const text = CRM_STATES[delivery.state]
  if (!text || delivery.state === previousState) return null
  const error = delivery.state !== 'sent' && delivery.lastError ? `: ${delivery.lastError}` : ''
  return `${subject}: ${text}${error}`.slice(0, 300)
}
