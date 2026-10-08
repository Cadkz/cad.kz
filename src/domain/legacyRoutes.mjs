/**
 * Старые адреса cad.kz (1С-Битрикс): чистые функции без базы и Next.js.
 * Товары со старым адресом /catalog/<раздел>/<код>/ открываются по нему же,
 * всё остальное постоянно перенаправляется на ближайшую страницу нового сайта.
 */

/** Заголовок с исходным адресом от proxy: странице старых адресов нужно знать, был ли слеш в конце. */
export const LEGACY_PATH_HEADER = 'x-cad-path'

/** @typedef {{ group?: string, direction?: string, type?: string, vendor?: string }} CatalogQuery */
/** @typedef {{ to: string } | { catalog: CatalogQuery }} StaticTarget */

/** Путь без домена, раскодированный, с одним ведущим слешем и без повторов слешей. */
export function cleanPath(pathname) {
  let path = String(pathname || '/')
  try {
    path = decodeURIComponent(path)
  } catch {
    // Битая кодировка: оставляем как есть, такой адрес просто не совпадёт ни с одним правилом.
  }
  path = `/${path}`.replace(/\/{2,}/g, '/')
  return path
}

/** Варианты написания одного адреса: со слешем в конце и без него. */
export function pathVariants(pathname) {
  const path = cleanPath(pathname)
  if (path === '/') return ['/']
  const bare = path.replace(/\/+$/, '')
  return [bare, `${bare}/`]
}

/** Как старый адрес может быть записан в админке: с доменом cad.kz или без, со слешем или без. */
export function storedVariants(pathname) {
  const variants = pathVariants(pathname)
  return [...variants, ...variants.map((v) => `https://cad.kz${v}`)]
}

/** Адрес товара на старом сайте — он же адрес на новом, если товар был в картах сайта. */
export function catalogPath(section, code) {
  return `/catalog/${section}/${code}/`
}

/**
 * Разбор адреса каталога: раздел и, если есть, код товара.
 * @returns {{ section: string | null, code: string | null } | null}
 */
export function parseCatalogPath(pathname) {
  const parts = cleanPath(pathname).split('/').filter(Boolean)
  if (parts[0] !== 'catalog' || parts.length > 3) return null
  return { section: parts[1] ?? null, code: parts[2] ?? null }
}

/**
 * Подсказки для старых разделов, у которых в картах сайта нет своих товаров (это родительские
 * разделы: товары лежат в подразделах) или товары разных производителей. Производитель
 * и направление проверяются по базе: если на сайте их нет, берётся группа, затем весь каталог.
 * @type {Record<string, CatalogQuery>}
 */
const ntp = { vendor: 'НТП Трубопровод', group: 'software' }
const sectionHints = {
  software: { group: 'software' },
  hardware: { group: 'hardware' },
  services: { group: 'service' },
  cad_training: { group: 'service' },
  uchebnye_versii: { group: 'software' },
  novye_versii9: { group: 'software' },
  novye_versii10: { group: 'software' },
  novye_versii11: { group: 'software' },
  '3d_skanery_artec': { vendor: 'Artec 3D', group: 'hardware' },
  WideTek: { vendor: 'Image Access', group: 'hardware' },
  ars_ps: { vendor: 'АРС-ПС', group: 'software' },
  chaos_group: { vendor: 'Chaos Group', group: 'software' },
  csoft_development: { vendor: 'Csoft Development', group: 'software' },
  project_studio_cs: { vendor: 'Csoft Development', group: 'software' },
  fine_software: { vendor: 'Fine Software', group: 'software' },
  lira_sapr: { vendor: 'ЛИРА-FEM', group: 'software' },
  magicad: { vendor: 'MagiCAD', group: 'software' },
  scad_soft: { vendor: 'SCAD', group: 'software' },
  ntp_truboprovod: ntp,
  izolyatsiya: ntp,
  passat: ntp,
  predklapan: ntp,
  shtutser_mke: ntp,
  the_scope_of: { group: 'software' },
  basic_cad: { group: 'software' },
  architectural_cad: { direction: 'arch', group: 'software' },
  bim_design: { direction: 'arch', group: 'software' },
  Structural_cad: { direction: 'structural', group: 'software' },
  engineering_cad: { direction: 'mep', group: 'software' },
  infrastructure_cad: { direction: 'infra', group: 'software' },
  design_and_visualization: { direction: 'viz', group: 'software' },
  mechanical_engineering: { direction: 'machine', group: 'software' },
  process_design_and_calculations: { direction: 'pipes', group: 'software' },
}

/** Подсказка для старого раздела (производитель, направление, группа каталога) или пустая. */
export function sectionHint(section) {
  return (section && Object.hasOwn(sectionHints, section) && sectionHints[section]) || {}
}

const home = { to: '/' }

/**
 * Правила для старых адресов вне каталога. Порядок важен: первое совпадение побеждает.
 * @type {[RegExp, StaticTarget][]}
 */
const rules = [
  [/^\/about\/news(\/|$)/i, { to: '/news' }],
  [/^\/about\/actions(\/|$)/i, { to: '/news?kind=promotion' }],
  [/^\/articles\/.+/i, { to: '/articles' }],
  [/^\/about\/manufacturer(\/|$)/i, { catalog: {} }],
  [/^\/training(\/|$)/i, { catalog: { group: 'service' } }],
  [
    /^\/(about|contacts|users|webstat|search|login|auth|personal|forum|files|upload|bitrix)(\/|$)/i,
    home,
  ],
  [/^\/[^/]+\.(php|html?)$/i, home],
]

/**
 * Куда вести старый адрес вне каталога. null — адрес не старый (или это страница нового сайта).
 * @returns {StaticTarget | null}
 */
export function staticLegacyTarget(pathname) {
  const path = cleanPath(pathname)
  for (const [pattern, target] of rules) if (pattern.test(path)) return target
  return null
}

/** Адрес обрабатывается страницей старых адресов (а не обычной страницей нового сайта). */
export function isLegacyPath(pathname) {
  return parseCatalogPath(pathname) !== null || staticLegacyTarget(pathname) !== null
}

/** Имя производителя из старого адреса /about/manufacturer/<имя>/; числовые ID не годятся. */
export function manufacturerName(pathname) {
  const match = /^\/about\/manufacturer\/([^/]+)/i.exec(cleanPath(pathname))
  if (!match) return null
  const name = match[1].replace(/\+/g, ' ').trim()
  return /^\d+$/.test(name) ? null : name
}

/** Группа каталога по типу товара. */
export const kindGroup = {
  software: 'software',
  hardware: 'hardware',
  course: 'service',
  service: 'service',
}
