/**
 * Тексты из базы по аудиту 21.10.2026, пакет 5 «Тексты и названия»: [прежний, новый].
 * Настройка `texts-setup:audit-v1` меняет поле, только если в нём всё ещё прежний текст —
 * правленное в админке не трогает.
 */

/** Т7: одна подпись продления у всех программ. */
/** @type {readonly [string, string]} */
export const RENEW_LABEL_FIX = ['Продлить подписку', 'Продлить лицензию']

/** Т21: описание направления «Машиностроение» — с программами, а не только со сканерами. */
/** @type {readonly [string, string]} */
export const MACHINE_SUMMARY_FIX = [
  'Деталь и сборка, 3D-сканеры Artec для реверс-инжиниринга.',
  'Inventor, Fusion, MechaniCS — детали, сборки, чертежи; сканеры Artec для реверс-инжиниринга.',
]

/**
 * Новое значение поля, если в нём прежний текст; иначе null (правили в админке или уже новое).
 * @param {string | null | undefined} value
 * @param {readonly [string, string]} fix
 */
export function replaceIfOld(value, [before, after]) {
  return (value ?? '').trim() === before ? after : null
}
