// Картинки карточек каталога по правилу владельца (21.10.2026): у программы — её логотип,
// у оборудования — фото самого устройства. Никаких скриншотов интерфейса и фото старых коробок.
// Что выбрать в карточку (первое найденное):
//   программа — «Картинка для карточки» у товара → логотип программы отсюда → «Логотип» у
//     производителя в админке → логотип производителя отсюда → подложка со значком раздела;
//   оборудование — «Картинка для карточки» → первая картинка галереи → подложка;
//   курс и услуга — «Картинка для карточки» → галерея → картинка производителя (как раньше).
// Файлы — public/images/brands (источники — src/domain/brands.mjs; GEO5 — от владельца).

/** @typedef {{ url: string, width: number, height: number }} StaticLogo */

const AUTOCAD = { url: '/images/brands/autocad.webp', width: 75, height: 75 }
const REVIT = { url: '/images/brands/revit.webp', width: 75, height: 75 }
const FUSION = { url: '/images/brands/fusion.webp', width: 75, height: 75 }
const GEO5 = { url: '/images/brands/geo5-full.webp', width: 294, height: 400 }
const SCAD = { url: '/images/brands/scad.webp', width: 80, height: 80 }
const LIRA = { url: '/images/brands/lira.webp', width: 80, height: 80 }
const ABC = { url: '/images/brands/abc.webp', width: 80, height: 80 }
const ARTEC = { url: '/images/brands/artec.svg', width: 80, height: 70 }

/**
 * Логотипы отдельных программ: первое подходящее правило. Комплекты из нескольких программ
 * (AutoCAD Revit LT Suite, коллекции) своего значка не берут — у них логотип производителя.
 * @type {{ vendor: string, title: RegExp, logo: StaticLogo | null }[]}
 */
export const PROGRAM_LOGOS = [
  { vendor: 'Autodesk', title: /suite|collection/i, logo: null },
  { vendor: 'Autodesk', title: /^AutoCAD\b/i, logo: AUTOCAD },
  { vendor: 'Autodesk', title: /^Revit\b/i, logo: REVIT },
  { vendor: 'Autodesk', title: /^Fusion\b/i, logo: FUSION },
  { vendor: 'Fine Software', title: /^GEO5\b/i, logo: GEO5 },
  // Программы Artec в каталоге стоят рядом со сканерами и могут быть отмечены как оборудование.
  { vendor: 'Artec 3D', title: /\b(studio|cloud)\b/i, logo: ARTEC },
]

/** Логотип производителя для всех его программ, если в админке у производителя свой не загружен. */
/** @type {Record<string, StaticLogo>} */
export const VENDOR_LOGOS = {
  'SCAD Soft': SCAD,
  'ЛИРА-FEM': LIRA,
  АВС: ABC,
  'Artec 3D': ARTEC,
}

/**
 * Логотип программы по правилам или null.
 * @param {{ title: string, vendor: string | null }} product
 * @returns {StaticLogo | null}
 */
export function programLogo(product) {
  const rule = PROGRAM_LOGOS.find(
    (item) => item.vendor === product.vendor && item.title.test(product.title.trim()),
  )
  return rule?.logo ?? null
}

/**
 * Логотип производителя из кода или null.
 * @param {string | null} vendor
 * @returns {StaticLogo | null}
 */
export function vendorLogo(vendor) {
  return (vendor && VENDOR_LOGOS[vendor]) || null
}
