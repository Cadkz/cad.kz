// @ts-check
/**
 * Иллюстрации разделов, категорий и групп (пачки владельца 03.11.2026: «CAD-kz-icons-REFERENCE-
 * MATCHED» и «CAD-kz-education-services», PNG 256 → WebP). Решение владельца 03.11.2026, вечер:
 * значков старого образца (линейные lucide) на сайте не остаётся — везде, где был значок раздела,
 * стоит иллюстрация. Где своей картинки ещё нет, взята ближайшая по смыслу (список «догенерировать»
 * — в docs/HANDOFF.md).
 *
 * Ключ иллюстрации — имя файла: «cad-bim» → /images/sections/cad-bim.webp, «course-viz» →
 * /images/courses/viz.webp.
 */

/** Файлы в public/images/sections. */
const SECTION_FILES = new Set([
  '3d-scanners',
  'cad-bim',
  'consulting',
  'estimates',
  'geotechnics',
  'mechanics',
  'mep-networks',
  'roads-survey',
  'services',
  'structures',
  'training',
  'wide-plotters',
  'wide-scanners',
  'workstations',
])

/** Файлы в public/images/courses (ключ «course-<имя>»). */
const COURSE_FILES = new Set(['bim', 'corporate', 'infra', 'mep', 'other', 'structural', 'viz'])

/**
 * Раздел по адресу (slug) → иллюстрация. Старые и влитые адреса — те же картинки.
 * @type {Record<string, string>}
 */
const ART = {
  arch: 'cad-bim',
  viz: 'course-viz',
  cad: 'cad-bim',
  structural: 'structures',
  geotech: 'geotechnics',
  estimate: 'estimates',
  machine: 'mechanics',
  infra: 'roads-survey',
  mep: 'mep-networks',
  pipes: 'mep-networks',
  training: 'training',
  scanners: '3d-scanners',
  '3d-scanners': '3d-scanners',
  'wide-format': 'wide-plotters',
  plotters: 'wide-plotters',
  'wide-scanners': 'wide-scanners',
  consulting: 'consulting',
  workstations: 'workstations',
  services: 'services',
  service: 'services',
  hardware: '3d-scanners',
}

/**
 * Прежние ключи значков (поле «Иконка» раздела в админке, группы семейств, темы курсов) →
 * иллюстрация. Ближайшая по смыслу, пока своей нет: compass (САПР), brick, tree, wind, shapes,
 * layers.
 * @type {Record<string, string>}
 */
const ICON_ART = {
  building: 'cad-bim',
  compass: 'cad-bim',
  columns: 'structures',
  brick: 'structures',
  tree: 'structures',
  wind: 'structures',
  shapes: 'structures',
  layers: 'geotechnics',
  mountain: 'geotechnics',
  route: 'roads-survey',
  wrench: 'mep-networks',
  droplet: 'mep-networks',
  cog: 'mechanics',
  image: 'course-viz',
  file: 'estimates',
  scan: '3d-scanners',
  printer: 'wide-plotters',
  monitor: 'workstations',
  graduation: 'training',
}

/** Иллюстрация, если ничего не подошло: общая «САПР и BIM». */
const FALLBACK = 'cad-bim'

/**
 * Адрес файла по ключу иллюстрации или null.
 * @param {string} key
 * @returns {string | null}
 */
function fileUrl(key) {
  if (SECTION_FILES.has(key)) return `/images/sections/${key}.webp`
  if (key.startsWith('course-') && COURSE_FILES.has(key.slice(7)))
    return `/images/courses/${key.slice(7)}.webp`
  return null
}

/**
 * Адрес картинки раздела по его адресу или null.
 * @param {string | null | undefined} slug
 * @returns {string | null}
 */
export function sectionArtUrl(slug) {
  const key = slug ? ART[slug] : undefined
  return key ? fileUrl(key) : null
}

/**
 * Ключ значка раздела: у раздела со своей иллюстрацией — она (у «Услуг» в админке мог стоять
 * гаечный ключ, а картинка своя), иначе прежний ключ из админки.
 * @param {string | null | undefined} slug
 * @param {string | null | undefined} icon
 * @returns {string | null}
 */
export function sectionIconKey(slug, icon) {
  return (slug && ART[slug]) || icon || null
}

/**
 * Адрес иллюстрации по ключу значка: имя файла или прежний ключ lucide. Пусто или неизвестно —
 * общая иллюстрация, чтобы старых значков не оставалось.
 * @param {string | null | undefined} icon
 * @returns {string}
 */
export function iconArtUrl(icon) {
  const key = icon ? (ICON_ART[icon] ?? icon) : FALLBACK
  return fileUrl(key) ?? fileUrl(FALLBACK) ?? ''
}
