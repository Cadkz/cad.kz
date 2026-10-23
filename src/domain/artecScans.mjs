// Примеры сканов Artec для страниц сканеров (24.10.2026). Исходники — образцы с artec3d.com
// (папка владельца artec-scans), лицензия Creative Commons Attribution 3.0: публиковать можно,
// с указанием автора — подпись под блоком. Сетки уменьшены до 60–120 тыс. треугольников
// (trimesh + fast-simplification, затем gltf-transform quantize без декодера): 0,6–1,2 МБ на скан.
// Файлы лежат в public/models/scans — отдаются как статика, хранилище картинок не тратится.

/** @typedef {{ title: string, src: string }} Scan */

/** Artec Leo: artec_leo — slug на сайте, artec-leo — в демоданных. */
const LEO = [
  { title: 'Двигатель автомобиля', src: '/models/scans/leo-car-engine.glb' },
  { title: 'Полуось', src: '/models/scans/leo-axle-shaft.glb' },
]

/** @type {Record<string, Scan[]>} */
const SCANS = {
  artec_leo: LEO,
  'artec-leo': LEO,
  artec_eva: [
    { title: 'Головка цилиндра мотоцикла', src: '/models/scans/eva-cylinder-head.glb' },
    { title: 'Металлический стол', src: '/models/scans/eva-metal-table.glb' },
  ],
  artec_spider_ii: [
    { title: 'Водяной насос автомобиля', src: '/models/scans/spider-water-pump.glb' },
    { title: 'Металлическая деталь', src: '/models/scans/spider-metal-part.glb' },
  ],
  artec_micro_ii: [
    { title: 'Винт', src: '/models/scans/micro-screw.glb' },
    { title: 'Гипсовый слепок зубов', src: '/models/scans/micro-teeth.glb' },
  ],
  artec_ray_ii: [{ title: 'Фасад церкви', src: '/models/scans/ray-church-facade.glb' }],
}

export const SCANS_CREDIT = 'Модели: Artec 3D, лицензия CC BY 3.0'

/** @param {string} slug @returns {Scan[]} */
export function productScans(slug) {
  return SCANS[slug] ?? []
}
