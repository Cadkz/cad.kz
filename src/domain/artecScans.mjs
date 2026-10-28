// Примеры сканов Artec для страниц сканеров (24.10.2026). Исходники — образцы с artec3d.com
// (папка владельца artec-scans), лицензия Creative Commons Attribution 3.0: публиковать можно,
// с указанием автора — подпись под блоком. С 28.10.2026 — полное качество (просьба владельца:
// у прежних 60–120 тыс. треугольников без нормалей трубы были гранёные): исходник целиком, если
// в нём до 4 млн треугольников, иначе упрощён до 4 млн; гладкие нормали; сжатие Draco
// (gltf-transform draco, позиции 14 бит, нормали 10 бит) — 0,9–9,2 МБ на скан. Декодер Draco —
// public/draco (из three 0.172.0). Грузится только по нажатию «Покрутить в 3D».
// Один светло-серый материал у всех: модели читаются на тёмно-синем фоне с сеткой.
// Превью — снимок модели в том же ракурсе, WebP 640 × 480 на прозрачном фоне (public/images/scans).
// Файлы — статика сайта, хранилище картинок не тратится.
//
// Какие сканы показать у товара, выбирают в админке: товар → вкладка «Примеры сканов». Здесь —
// библиотека готовых сканов (добавить новый — обработать файл и дописать строку) и набор по
// умолчанию, который разовая настройка ставит товарам.

/**
 * @typedef {{
 *   id: string,
 *   title: string,
 *   scanner: string,
 *   orbit?: string,
 *   orientation?: string,
 * }} ScanSeed
 * @typedef {{
 *   id: string,
 *   title: string,
 *   src: string,
 *   poster: string,
 *   orbit: string,
 *   orientation: string,
 * }} Scan
 */

/** Ракурс по умолчанию: чуть сбоку и сверху, как деталь на столе. */
const ORBIT = '35deg 70deg auto'
const ORIENTATION = '0deg 0deg 0deg'

/** @type {ScanSeed[]} */
const LIBRARY = [
  { id: 'leo-car-engine', title: 'Двигатель автомобиля', scanner: 'Artec Leo' },
  { id: 'leo-bmw-manifold', title: 'Коллектор BMW', scanner: 'Artec Leo' },
  { id: 'leo-pipework', title: 'Трубопроводы', scanner: 'Artec Leo' },
  { id: 'leo-axle-shaft', title: 'Полуось', scanner: 'Artec Leo' },
  { id: 'eva-cylinder-head', title: 'Головка цилиндра мотоцикла', scanner: 'Artec Eva' },
  { id: 'eva-moto-wheel', title: 'Колесо мотоцикла', scanner: 'Artec Eva' },
  { id: 'eva-side-table', title: 'Приставной столик', scanner: 'Artec Eva' },
  { id: 'eva-metal-table', title: 'Металлический стол', scanner: 'Artec Eva' },
  { id: 'spider-water-pump', title: 'Водяной насос автомобиля', scanner: 'Artec Spider II' },
  { id: 'spider-water-pump-2', title: 'Корпус насоса', scanner: 'Artec Spider II' },
  { id: 'spider-gamepad', title: 'Геймпад', scanner: 'Artec Spider II' },
  { id: 'spider-metal-part', title: 'Металлическая деталь', scanner: 'Artec Spider II' },
  { id: 'micro-industrial-part', title: 'Промышленная деталь', scanner: 'Artec Micro II' },
  { id: 'micro-screw', title: 'Винт', scanner: 'Artec Micro II' },
  { id: 'micro-copper-key', title: 'Медный ключ', scanner: 'Artec Micro II' },
  {
    id: 'micro-teeth',
    title: 'Гипсовый слепок зубов',
    scanner: 'Artec Micro II',
    orbit: '270deg 75deg auto',
  },
  { id: 'point-engine', title: 'Блок четырёхцилиндрового двигателя', scanner: 'Artec Point II' },
  { id: 'point-cam-gear', title: 'Шестерня распредвала', scanner: 'Artec Point II' },
  { id: 'point-car-rim', title: 'Автомобильный диск', scanner: 'Artec Point II' },
  {
    id: 'ray-church-facade',
    title: 'Фасад церкви',
    scanner: 'Artec Ray II',
    orbit: '90deg 80deg auto',
    orientation: '0deg -90deg 0deg',
  },
  {
    id: 'ray-pipes',
    title: 'Трубная обвязка',
    scanner: 'Artec Ray II',
    orientation: '-90deg 0deg 0deg',
  },
]

/** @param {ScanSeed} seed @returns {Scan} */
const toScan = (seed) => ({
  id: seed.id,
  title: seed.title,
  src: `/models/scans/${seed.id}.glb`,
  poster: `/images/scans/${seed.id}.webp`,
  orbit: seed.orbit ?? ORBIT,
  orientation: seed.orientation ?? ORIENTATION,
})

/** Варианты для списка в админке: «Artec Leo — Двигатель автомобиля». */
export const SCAN_OPTIONS = LIBRARY.map((seed) => ({
  label: `${seed.scanner} — ${seed.title}`,
  value: seed.id,
}))

/** @param {string} id @returns {Scan | null} */
export function scanById(id) {
  const seed = LIBRARY.find((entry) => entry.id === id)
  return seed ? toScan(seed) : null
}

/** Набор по умолчанию: сканы, снятые этой моделью. artec-leo — slug в демоданных. */
const BY_SCANNER = {
  artec_leo: 'Artec Leo',
  'artec-leo': 'Artec Leo',
  artec_eva: 'Artec Eva',
  artec_spider_ii: 'Artec Spider II',
  artec_micro_ii: 'Artec Micro II',
  artec_point_ii: 'Artec Point II',
  artec_ray_ii: 'Artec Ray II',
}

/** @param {string} slug @returns {string[]} */
export function defaultScanIds(slug) {
  const scanner = BY_SCANNER[/** @type {keyof typeof BY_SCANNER} */ (slug)]
  return scanner ? LIBRARY.filter((seed) => seed.scanner === scanner).map((seed) => seed.id) : []
}

export const SCANS_CREDIT = 'Модели: Artec 3D, лицензия CC BY 3.0'
