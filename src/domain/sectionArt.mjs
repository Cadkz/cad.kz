// @ts-check
/**
 * Иллюстрации разделов каталога и мегаменю (файлы владельца 03.11.2026, «CAD-kz-icons-REFERENCE-
 * MATCHED», по одобренному концепту). Ключ — адрес раздела (slug); старые и влитые адреса — те же
 * картинки. Раздела нет в списке — остаётся прежний значок lucide.
 * @type {Record<string, string>}
 */
const ART = {
  arch: 'cad-bim',
  viz: 'cad-bim',
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
  'wide-format': 'wide-plotters',
  plotters: 'wide-plotters',
  'wide-scanners': 'wide-scanners',
}

/**
 * Адрес картинки раздела или null.
 * @param {string | null | undefined} slug
 * @returns {string | null}
 */
export function sectionArtUrl(slug) {
  const file = slug ? ART[slug] : undefined
  return file ? `/images/sections/${file}.webp` : null
}
