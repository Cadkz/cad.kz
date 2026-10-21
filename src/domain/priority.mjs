/**
 * Приоритет показа товаров: топы продаж всегда первыми в меню, каталоге и подборках.
 * Чистые функции без базы.
 *
 * Уровень товара задаётся у товара («Приоритет показа»), пусто — берётся уровень производителя.
 * У раздела можно задать порядок производителей («Первыми в разделе»): в «Геотехнике» сначала GEO5,
 * потом ЛИРА и SCAD, в «Расчёте конструкций» — SCAD и ЛИРА. Порядок производителя решает только
 * внутри одного уровня: топ продаж другого производителя всё равно выше обычного товара.
 */

/** Уровни по убыванию. Значения хранятся в CMS, подписи — в админке. */
export const PRIORITY_LEVELS = /** @type {const} */ (['flagship', 'top', 'normal', 'low'])

/** @typedef {'flagship' | 'top' | 'normal' | 'low'} PriorityLevel */

/** @type {Record<PriorityLevel, number>} */
const RANK = { flagship: 3, top: 2, normal: 1, low: 0 }

/**
 * Топы продаж по местам (решение владельца 21.10.2026: AutoCAD, АВС, Revit, SCAD Office, GEO5,
 * Artec, CSoft, потом ЛИРА) выше любого уровня: место 1 — ранг 109, место 2 — 108 и т. д.
 * Ниже них — флагманы и остальные по уровню.
 */
const TOP_BASE = 10
const TOP_PLACES = 99

/**
 * Числовой ранг товара: место в топе продаж, иначе свой уровень, иначе производителя, иначе обычный.
 * @param {string | null | undefined} own
 * @param {string | null | undefined} vendor
 * @param {number | null | undefined} [topOrder] «Место в топе продаж» у товара (1 — первым)
 * @returns {number}
 */
export function priorityRank(own, vendor, topOrder) {
  if (topOrder != null && topOrder >= 1 && topOrder <= TOP_PLACES) {
    return TOP_BASE + TOP_PLACES + 1 - Math.round(topOrder)
  }
  const level = own || vendor || 'normal'
  return RANK[/** @type {PriorityLevel} */ (level)] ?? RANK.normal
}

/** Ступень для сравнения в разделе: все топы продаж — одна ступень, там решает порядок раздела. */
const tier = (/** @type {number} */ rank) => (rank >= TOP_BASE ? TOP_BASE : rank)

/**
 * @typedef {{ rank: number, vendor: string | number | null, main: string | number | null,
 *   title: string }} Ranked
 */

/**
 * Сравнение двух товаров в разделе: ступень (топы продаж, флагман, топ…) → порядок производителя
 * в разделе → место в топе или уровень → основной раздел совпадает → название. Во всём каталоге
 * производители раздела не заданы, и топы продаж идут строго по местам; в разделе с заданным
 * порядком производителей (в «Геотехнике» сначала GEO5) порядок раздела важнее мест.
 * @param {string | number | null} section раздел, в котором показываем (null — весь каталог)
 * @param {(string | number)[]} pins производители раздела по порядку
 * @returns {(a: Ranked, b: Ranked) => number}
 */
export function compareInSection(section = null, pins = []) {
  const pinIndex = (/** @type {Ranked} */ item) => {
    const index = item.vendor == null ? -1 : pins.indexOf(item.vendor)
    return index === -1 ? pins.length : index
  }
  return (a, b) =>
    tier(b.rank) - tier(a.rank) ||
    pinIndex(a) - pinIndex(b) ||
    b.rank - a.rank ||
    (section == null ? 0 : Number(b.main === section) - Number(a.main === section)) ||
    a.title.localeCompare(b.title, 'ru', { numeric: true })
}

/** Сколько товаров одного производителя показывать подряд в короткой колонке меню. */
export const MENU_PER_VENDOR = 2

/**
 * Короткий список для меню из уже отсортированных товаров: от одного производителя сначала не больше
 * `perVendor` (чтобы 40 модулей GEO5 не заняли всю колонку и после GEO5 были видны ЛИРА и SCAD).
 * Разнообразие не важнее уровня: если других производителей того же уровня не осталось, место
 * получает следующий топ, а не обычный товар.
 * @template {{ vendor: string | number | null, rank: number }} T
 * @param {T[]} sorted
 * @param {number} limit
 * @param {number} [perVendor]
 * @returns {T[]}
 */
export function pickVaried(sorted, limit, perVendor = MENU_PER_VENDOR) {
  /** @type {Map<string | number | null, number>} */
  const taken = new Map()
  const left = [...sorted]
  /** @type {T[]} */
  const picked = []
  const capped = (/** @type {T} */ item) =>
    item.vendor != null && (taken.get(item.vendor) ?? 0) >= perVendor
  while (picked.length < limit && left.length) {
    const best = left[0]
    const varied = left.find((item) => !capped(item))
    const next = varied && varied.rank >= best.rank ? varied : best
    left.splice(left.indexOf(next), 1)
    picked.push(next)
    taken.set(next.vendor, (taken.get(next.vendor) ?? 0) + 1)
  }
  return picked.sort((a, b) => sorted.indexOf(a) - sorted.indexOf(b))
}
