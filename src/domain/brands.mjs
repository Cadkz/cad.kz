// Фирменный вид плиток «Популярных решений» (замечание владельца 12.10.2026): логотип программы
// с сайта производителя и её фирменный цвет. Плитка узнаётся по названию, поэтому порядок
// и названия по-прежнему правятся в админке. Логотипы — public/images/brands, цвета — токены
// --brand-* в src/styles/tokens.css (только для этих плиток).

/**
 * @typedef {{ key: string, match: RegExp, logo: string }} Brand
 * Логотипы 80 × 80 (Autodesk — 75 × 75), источники:
 * AutoCAD, Revit, Fusion — значки autodesk.com; GEO5 — finesoftware.eu; SCAD — scadsoft.com;
 * ЛИРА — liraland.com; Artec — artec3d.com; АВС-KZ — картинка товара в «Медиа».
 */
/** @type {Brand[]} */
export const BRANDS = [
  { key: 'autocad', match: /autocad|автокад/i, logo: '/images/brands/autocad.webp' },
  { key: 'revit', match: /revit|ревит/i, logo: '/images/brands/revit.webp' },
  { key: 'fusion', match: /fusion/i, logo: '/images/brands/fusion.webp' },
  { key: 'abc', match: /авс|abc/i, logo: '/images/brands/abc.webp' },
  { key: 'geo5', match: /geo\s*5/i, logo: '/images/brands/geo5.svg' },
  { key: 'scad', match: /scad|скад/i, logo: '/images/brands/scad.webp' },
  { key: 'lira', match: /лира|lira/i, logo: '/images/brands/lira.webp' },
  { key: 'artec', match: /artec|артек/i, logo: '/images/brands/artec.svg' },
]

/**
 * Фирменный вид по названию плитки; null — обычная плитка с картинкой товара.
 * @param {string} title
 * @returns {Brand | null}
 */
export function brandOf(title) {
  return BRANDS.find((brand) => brand.match.test(title)) ?? null
}
