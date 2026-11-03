// Картинки карточек каталога по правилу владельца (21.10.2026): у программы — её логотип,
// у оборудования — фото самого устройства. Никаких скриншотов интерфейса и фото старых коробок.
// Что выбрать в карточку (первое найденное):
//   программа — «Картинка для карточки» у товара → логотип программы отсюда → «Логотип» у
//     производителя в админке → логотип производителя отсюда → подложка со значком раздела;
//   оборудование — «Картинка для карточки» → первая картинка галереи → подложка;
//   курс и услуга — «Картинка для карточки» → галерея → картинка производителя (как раньше).
// Файлы — public/images/brands (источники — src/domain/brands.mjs; GEO5 — от владельца).

/** @typedef {{ url: string, width: number, height: number }} StaticLogo */

const GEO5 = { url: '/images/brands/geo5-full.webp', width: 294, height: 400 }
const SCAD = { url: '/images/brands/scad.webp', width: 80, height: 80 }
const LIRA = { url: '/images/brands/lira.webp', width: 80, height: 80 }
const ABC = { url: '/images/brands/abc.webp', width: 80, height: 80 }
const ARTEC = { url: '/images/brands/artec.svg', width: 80, height: 70 }
// Логотипы от владельца (03.11.2026): белые поля обрезаны, WebP до 400 px.
const CHAOS = { url: '/images/brands/chaos.webp', width: 400, height: 170 }
const MAGICAD = { url: '/images/brands/magicad/magicad.webp', width: 191, height: 151 }
const NTP = { url: '/images/brands/ntp.webp', width: 192, height: 150 }
const ARS = { url: '/images/brands/ars-ps.webp', width: 150, height: 118 }
const BASE = { url: '/images/brands/base.webp', width: 342, height: 119 }

/**
 * @param {string} file
 * @param {number} width
 * @param {number} height
 * @returns {StaticLogo}
 */
const chaos = (file, width, height) => ({ url: `/images/brands/chaos/${file}.webp`, width, height })

/**
 * Chaos: V-Ray под каждую программу и Phoenix FD для 3ds Max. Правило требует «V-Ray» в названии,
 * чтобы Phoenix FD для Maya не взял значок V-Ray для Maya; остальное — общий логотип Chaos.
 * @type {[RegExp, StaticLogo][]}
 */
const CHAOS_PROGRAMS = [
  [/phoenix.*3ds\s*max/i, chaos('phoenix-3ds-max', 182, 222)],
  [/v-?\s?ray.*cloud|cloud credit/i, chaos('vray-cloud', 194, 78)],
  [/v-?\s?ray.*3ds\s*max/i, chaos('vray-3ds-max', 400, 143)],
  [/v-?\s?ray.*sketchup/i, chaos('vray-sketchup', 270, 167)],
  [/v-?\s?ray.*revit/i, chaos('vray-revit', 269, 180)],
  [/v-?\s?ray.*rhino/i, chaos('vray-rhino', 400, 161)],
  [/v-?\s?ray.*maya/i, chaos('vray-maya', 216, 90)],
  [/v-?\s?ray.*cinema\s*4d/i, chaos('vray-cinema-4d', 400, 133)],
  [/v-?\s?ray.*unreal/i, chaos('vray-unreal', 279, 107)],
  [/v-?\s?ray.*nuke/i, chaos('vray-nuke', 400, 159)],
]

/**
 * Значок Autodesk из набора владельца (21.10.2026, public/images/brands/autodesk): PNG 75 × 75,
 * у Revit, Inventor и коллекций AEC, M&E — SVG.
 * @param {string} name
 * @returns {StaticLogo}
 */
const adsk = (name) =>
  name.endsWith('.svg')
    ? { url: `/images/brands/autodesk/${name}`, width: 150, height: 150 }
    : { url: `/images/brands/autodesk/${name}.png`, width: 75, height: 75 }

/**
 * Autodesk: название (начало) → значок. Первое подходящее; частные варианты раньше общих.
 * @type {[RegExp, StaticLogo][]}
 */
const AUTODESK = [
  // LT комплект (бывш. AutoCAD Revit LT Suite): два знака внахлёст, замечание владельца 22.10.2026.
  [/revit lt suite|^lt комплект/i, adsk('lt-autocad-revit.svg')],
  [/^architecture engineering|aec collection/i, adsk('aec-collection.svg')],
  [/^product design/i, adsk('product-design-manufacturing-collection')],
  [/^media & entertainment/i, adsk('media-entertainment-collection.svg')],
  [/^autocad lt\b/i, adsk('autocad-lt')],
  [/^autocad\b/i, adsk('autocad')],
  [/^revit\b/i, adsk('revit.svg')],
  [/^inventor\b/i, adsk('inventor.svg')],
  [/^fusion 360 manage/i, adsk('fusion-360-manage')],
  [/^fusion 360 with netfabb/i, adsk('netfabb')],
  [/^fusion 360 with powerinspect/i, adsk('powerinspect')],
  [/^fusion 360 with powermill/i, adsk('powermill')],
  [/^fusion 360 with powershape/i, adsk('powershape')],
  [/^fusion\b/i, adsk('fusion-360')],
  [/^civil 3d/i, adsk('civil-3d')],
  [/^navisworks/i, adsk('navisworks-manage')],
  [/^vault plm/i, adsk('vault-plm')],
  [/^vault\b/i, adsk('vault')],
  [/^3ds max/i, adsk('3ds-max')],
  [/^maya\b/i, adsk('maya')],
  [/^motionbuilder/i, adsk('motionbuilder')],
  [/^arnold/i, adsk('arnold')],
  [/^flame assist/i, adsk('flame-assist')],
  [/^flame\b/i, adsk('flame')],
  [/^flare/i, adsk('flare')],
  [/^alias/i, adsk('alias')],
  [/^vred/i, adsk('vred-professional')],
  [/^advance steel/i, adsk('advance-steel')],
  [/^infraworks/i, adsk('infraworks')],
  [/^recap/i, adsk('recap-pro')],
  [/^point layout/i, adsk('point-layout')],
  [/^moldflow/i, adsk('moldflow-insight')],
  [/^netfabb/i, adsk('netfabb')],
  [/^camplete/i, adsk('camplete')],
  [/^fabrication camduct/i, adsk('fabrication-camduct')],
  [/^(autodesk )?cfd\b/i, adsk('autodesk-cfd-ultimate')],
  [/^autodesk docs/i, adsk('autodesk-docs')],
  [/^bim collaborate/i, adsk('autodesk-bim-collaborate-pro')],
  [/^(bim 360 )?build\b/i, adsk('autodesk-build')],
  [/^takeoff/i, adsk('autodesk-takeoff')],
]

/**
 * Логотипы отдельных программ: первое подходящее правило.
 * @type {{ vendor: string, title: RegExp, logo: StaticLogo | null }[]}
 */
export const PROGRAM_LOGOS = [
  ...AUTODESK.map(([title, logo]) => ({ vendor: 'Autodesk', title, logo })),
  { vendor: 'Fine Software', title: /^GEO5\b/i, logo: GEO5 },
  ...CHAOS_PROGRAMS.map(([title, logo]) => ({ vendor: 'Chaos Group', title, logo })),
  {
    vendor: 'MagiCAD',
    title: /revit/i,
    logo: { url: '/images/brands/magicad/magicad-revit.webp', width: 177, height: 189 },
  },
  {
    vendor: 'MagiCAD',
    title: /autocad/i,
    logo: { url: '/images/brands/magicad/magicad-autocad.webp', width: 177, height: 189 },
  },
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
  'Chaos Group': CHAOS,
  MagiCAD: MAGICAD,
  'НТП Трубопровод': NTP,
  'АРС-ПС': ARS,
  Base: BASE,
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
