// @ts-check
/**
 * Меньше повторов в карточке (замечание владельца 03.11.2026): в карточке MagiCAD «Вентиляция для
 * AutoCAD» слово MagiCAD стояло трижды (логотип, строка производителя, название), а «для AutoCAD» —
 * дважды (название и плашка «Плагин для AutoCAD»). Что уже сказано в названии, второй раз не пишем.
 */

/** @param {string} text */
const fold = (text) =>
  text
    .toLowerCase()
    .replace(/ё/g, 'е')
    .replace(/[^\p{L}\p{N}]+/gu, ' ')
    .trim()

/**
 * Строку производителя над названием показывать? Нет, если название с него начинается
 * («MagiCAD» над «MagiCAD Вентиляция», «GEO5» над «GEO5 Плита»).
 * @param {string | null | undefined} vendor
 * @param {string} title
 */
export function showVendorLine(vendor, title) {
  if (!vendor) return false
  const v = fold(vendor)
  const t = fold(title)
  return !(v && (t === v || t.startsWith(`${v} `)))
}

/**
 * Плашка «Плагин для …»: только программы, которых нет в названии. Все уже в названии
 * («… для AutoCAD») — плашки нет.
 * @param {string[]} requires названия базовых программ
 * @param {string} title
 * @returns {string | null}
 */
export function pluginBadge(requires, title) {
  const t = ` ${fold(title)} `
  const missing = requires.filter((name) => !t.includes(` ${fold(name)} `))
  return missing.length ? `Плагин для ${missing.join(' / ')}` : null
}
