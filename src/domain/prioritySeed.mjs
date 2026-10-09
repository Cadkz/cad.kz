/**
 * Первая настройка приоритета показа (решение владельца 09.10.2026): топы продаж — AutoCAD, Revit,
 * АВС, SCAD, ЛИРА, GEO5, Artec — всегда первыми. Дальше всё правится в админке: «Приоритет показа»
 * у товара и производителя, «Первыми в разделе» у раздела.
 */

/** Уровень всем товарам производителя. */
export const VENDOR_LEVELS = {
  SCAD: 'top',
  'ЛИРА-FEM': 'top',
  АВС: 'top',
  'Artec 3D': 'top',
}

/**
 * Уровень отдельным товарам (у Autodesk и Fine Software топы — не все программы).
 * Первое подходящее правило по порядку: флагманы раньше топов. vendor null — любой производитель.
 * Ключи защиты и обновления — в конец списков: их покупают к уже купленной программе, в меню они
 * занимали бы место топов.
 * @type {{ vendor: string | null, title: RegExp, level: 'flagship' | 'top' | 'low' }[]}
 */
export const PRODUCT_LEVELS = [
  { vendor: null, title: /^(обновление для|ключ|подписка на обновления)/i, level: 'low' },
  { vendor: 'Fine Software', title: /^GEO5$/i, level: 'flagship' },
  { vendor: 'Fine Software', title: /^GEO5\b/i, level: 'top' },
  { vendor: 'Autodesk', title: /^AutoCAD$/i, level: 'flagship' },
  { vendor: 'Autodesk', title: /^Revit\b/i, level: 'flagship' },
  { vendor: 'Autodesk', title: /^AutoCAD\b|\bRevit\b/i, level: 'top' },
  { vendor: 'SCAD', title: /^SCAD Office\b|универсальный комплект/i, level: 'flagship' },
  { vendor: 'ЛИРА-FEM', title: /^ЛИРА\s*-\s*FEM\b/i, level: 'flagship' },
  { vendor: 'АВС', title: /^Программный комплекс АВС/i, level: 'flagship' },
  { vendor: 'Artec 3D', title: /^Artec (Leo|Eva)$/i, level: 'flagship' },
]

/** Производители, которые в разделе идут первыми, по порядку (slug раздела → названия). */
export const SECTION_PINS = {
  geotech: ['Fine Software', 'ЛИРА-FEM', 'SCAD'],
  structural: ['SCAD', 'ЛИРА-FEM'],
  arch: ['Autodesk'],
  mep: ['Autodesk'],
  estimate: ['АВС'],
  scanners: ['Artec 3D'],
  machine: ['Autodesk', 'Artec 3D'],
}

/**
 * Уровень товара по правилам или null (тогда действует уровень производителя).
 * @param {{ title: string, vendor: string | null }} product
 * @returns {'flagship' | 'top' | 'low' | null}
 */
export function seedLevel(product) {
  const rule = PRODUCT_LEVELS.find(
    (item) =>
      (item.vendor === null || item.vendor === product.vendor) &&
      item.title.test(product.title.trim()),
  )
  return rule?.level ?? null
}
