// @ts-check
/**
 * Подборки «С этим покупают» по правилам владельца (27.10.2026): у каждой панели по две строки.
 * - У программ Autodesk второй строкой — коллекция: у строительных AEC Collection (AutoCAD, Revit,
 *   Civil 3D, Navisworks, 3ds Max и другие), у машиностроительных (Inventor, Fusion, Vault…) —
 *   Product Design & Manufacturing Collection (решение владельца 27.10.2026). Часто выгоднее
 *   отдельных подписок.
 * - К AutoCAD первой строкой — линейка «MagiCAD для AutoCAD», к Revit — «MagiCAD для Revit»:
 *   инженерные сети внутри своей программы.
 * Чистые функции без базы.
 */

/** Строк в каждой панели под товаром. */
export const PICKS_LIMIT = 2

/** AEC Collection по названию товара. */
export const AEC_TITLE = /^architecture engineering & construction collection|aec collection/i

/** Product Design & Manufacturing Collection по названию товара. */
export const PDMC_TITLE = /^product design (&|and) manufacturing collection|pdm collection/i

/** Машиностроительные программы Autodesk — к ним вторым PDMC, а не AEC. */
const MANUFACTURING =
  /inventor|fusion|vault|alias|vred|moldflow|netfabb|power(mill|shape|inspect)|featurecam|nastran|factory design|hsm|product design/i

/**
 * Какую коллекцию ставить второй к программе Autodesk: строительным — AEC, машиностроительным —
 * PDMC.
 * @param {string} title
 * @returns {RegExp}
 */
export function collectionFor(title) {
  return MANUFACTURING.test(title) ? PDMC_TITLE : AEC_TITLE
}

/**
 * Линейка, которую предлагать первой к программе: название товара → название линейки.
 * @type {[RegExp, string][]}
 */
export const LINE_PICKS = [
  [/^autocad$/i, 'MagiCAD для AutoCAD'],
  [/^revit$/i, 'MagiCAD для Revit'],
]

/**
 * Линейка для товара, если она есть в правилах.
 * @param {string} title
 * @returns {string | null}
 */
export function linePickFor(title) {
  return LINE_PICKS.find(([match]) => match.test(title.trim()))?.[1] ?? null
}

/**
 * Итог «С этим покупают»: сначала обязательные строки на своих местах, остальное — по порядку
 * подборки, без повторов, не больше limit.
 * @template T
 * @param {T[]} found подборка по разделам
 * @param {{ first?: T | null, second?: T | null }} pins что поставить первым и вторым
 * @param {(item: T) => string} keyOf
 * @param {number} [limit]
 * @returns {T[]}
 */
export function pinPicks(found, pins, keyOf, limit = PICKS_LIMIT) {
  const pinned = [pins.first, pins.second].filter(
    /** @returns {item is T} */ (item) => item != null,
  )
  const taken = new Set(pinned.map(keyOf))
  const rest = found.filter((item) => !taken.has(keyOf(item)))
  /** @type {T[]} */
  const result = []
  if (pins.first) result.push(pins.first)
  // Второе место за второй булавкой, даже если первой нет: AEC — всегда второй строкой.
  if (pins.second) {
    if (!pins.first && rest[0]) result.push(/** @type {T} */ (rest.shift()))
    result.push(pins.second)
  }
  return [...result, ...rest].slice(0, limit)
}
