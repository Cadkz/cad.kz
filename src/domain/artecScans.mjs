// Примеры сканов Artec для страниц сканеров. Модели — образцы Artec 3D (лицензия Creative
// Commons Attribution 3.0: публиковать можно с указанием автора — подпись под блоком).
//
// С 28.10.2026 (просьба владельца: «максимально близко к Artec») окно просмотра показывает
// те же модели и тем же просмотрщиком, что и artec3d.com, — встроенный плеер Sketchfab
// с прозрачным фоном: полное разрешение исходника (до 10 млн треугольников), их освещение
// и затенение. До нажатия на странице только картинка-превью: снимок того же плеера с
// Sketchfab, фон вырезается при сборке сайта (src/app/scan-posters), плеер грузится только
// в открытом окне.
//
// Какие сканы показать у товара, выбирают в админке: товар → вкладка «Примеры сканов». Здесь —
// библиотека готовых сканов (добавить новый — взять id модели Sketchfab со страницы
// artec3d.com/3d-models/…, дописать строку; превью соберётся само) и набор по умолчанию, который
// разовая настройка ставит товарам.

/**
 * @typedef {{ id: string, title: string, scanner: string, sketchfab: string }} ScanSeed
 * @typedef {{ id: string, title: string, embed: string, poster: string }} Scan
 */

/**
 * Параметры плеера: сразу запускается, прозрачный фон (видна наша чертёжная сетка), без
 * лишних панелей; dnt — без отслеживания посетителя.
 */
const EMBED_PARAMS = new URLSearchParams({
  autostart: '1',
  preload: '1',
  transparent: '1',
  dnt: '1',
  ui_infos: '0',
  ui_hint: '0',
  ui_help: '0',
  ui_settings: '0',
  ui_inspector: '0',
  ui_vr: '0',
  ui_ar: '0',
  ui_annotations: '0',
  // Свой крестик «остановить» у Sketchfab в углу ложился на наш «Закрыть».
  ui_stop: '0',
  ui_watermark_link: '0',
  ui_theme: 'dark',
  ui_color: '8ac4ff',
}).toString()

/** @type {ScanSeed[]} */
const LIBRARY = [
  {
    id: 'leo-car-engine',
    title: 'Двигатель автомобиля',
    scanner: 'Artec Leo',
    sketchfab: '564ce1b7e819425e9c714aa0e1bf81aa',
  },
  {
    id: 'leo-bmw-manifold',
    title: 'Коллектор BMW',
    scanner: 'Artec Leo',
    sketchfab: 'ff355d89ca1f48faabce3d67903da63c',
  },
  {
    id: 'leo-pipework',
    title: 'Трубопроводы',
    scanner: 'Artec Leo',
    sketchfab: '7688c89b394c4d0eb9af2f501bd23c0d',
  },
  {
    id: 'leo-axle-shaft',
    title: 'Полуось',
    scanner: 'Artec Leo',
    sketchfab: 'aefa00a94aae4200823b574fbea2a3b3',
  },
  {
    id: 'eva-cylinder-head',
    title: 'Головка цилиндра мотоцикла',
    scanner: 'Artec Eva',
    sketchfab: '15a0049850dd49228fa4e2b934da0da1',
  },
  {
    id: 'eva-moto-wheel',
    title: 'Колесо мотоцикла',
    scanner: 'Artec Eva',
    sketchfab: 'cb9ede9294864d6295348e3790e38468',
  },
  {
    id: 'eva-side-table',
    title: 'Приставной столик',
    scanner: 'Artec Eva',
    sketchfab: 'd1f60532db354820aa035d04ed77c81a',
  },
  {
    id: 'eva-metal-table',
    title: 'Металлический стол',
    scanner: 'Artec Eva',
    sketchfab: 'b8023d044d8e425a9706f6dd41d75ae5',
  },
  {
    id: 'spider-water-pump',
    title: 'Водяной насос автомобиля',
    scanner: 'Artec Spider II',
    sketchfab: '757debd13e9e42c8863af1d1d6565351',
  },
  {
    id: 'spider-water-pump-2',
    title: 'Корпус насоса',
    scanner: 'Artec Spider II',
    sketchfab: 'd5d6fe245f45419db592edc248e4910c',
  },
  {
    id: 'spider-gamepad',
    title: 'Геймпад',
    scanner: 'Artec Spider II',
    sketchfab: 'e76301522e5b4ee2b559855cb56162fa',
  },
  {
    id: 'spider-metal-part',
    title: 'Регулировочный рычаг',
    scanner: 'Artec Spider II',
    sketchfab: 'de55a328de4e47a18d830ec94cb67ab8',
  },
  {
    id: 'micro-industrial-part',
    title: 'Промышленная деталь',
    scanner: 'Artec Micro II',
    sketchfab: 'b7262e25428c4384b5be2f86de6dbf05',
  },
  {
    id: 'micro-screw',
    title: 'Винт',
    scanner: 'Artec Micro II',
    sketchfab: 'c6f7640246754c0a913b7946b8736bc6',
  },
  {
    id: 'micro-copper-key',
    title: 'Медный ключ',
    scanner: 'Artec Micro II',
    sketchfab: '79a75f0c4dff4675bc5bcd55e043ea98',
  },
  {
    id: 'micro-teeth',
    title: 'Гипсовый слепок зубов',
    scanner: 'Artec Micro II',
    sketchfab: 'c455fe9c3f2742ffb1bee9a307b859fa',
  },
  {
    id: 'point-engine',
    title: 'Блок четырёхцилиндрового двигателя',
    scanner: 'Artec Point II',
    sketchfab: '9ded1d8f996a4dcf9fe8faadb944f1ab',
  },
  {
    id: 'point-cam-gear',
    title: 'Шестерня распредвала',
    scanner: 'Artec Point II',
    sketchfab: 'd8bcffe7e06f4653a1c1e50d6d235228',
  },
  {
    id: 'point-car-rim',
    title: 'Автомобильный диск',
    scanner: 'Artec Point II',
    sketchfab: '51e8a4b9bdce4beabcfea9f7a7df5f00',
  },
  {
    id: 'ray-church-facade',
    title: 'Фасад церкви',
    scanner: 'Artec Ray II',
    sketchfab: 'fc92dbaee657421b8f93b56d67c2ae0a',
  },
  {
    id: 'ray-pipes',
    title: 'Трубная обвязка',
    scanner: 'Artec Ray II',
    sketchfab: 'f31247ed080945d38cce97aad766d095',
  },
]

/** @param {ScanSeed} seed @returns {Scan} */
const toScan = (seed) => ({
  id: seed.id,
  title: seed.title,
  embed: `https://sketchfab.com/models/${seed.sketchfab}/embed?${EMBED_PARAMS}`,
  poster: `/scan-posters/${seed.id}.webp`,
})

/** Варианты для списка в админке: «Artec Leo — Двигатель автомобиля». */
export const SCAN_OPTIONS = LIBRARY.map((seed) => ({
  label: `${seed.scanner} — ${seed.title}`,
  value: seed.id,
}))

/** id модели Sketchfab — для превью (src/app/scan-posters). @param {string} id */
export function sketchfabId(id) {
  return LIBRARY.find((entry) => entry.id === id)?.sketchfab ?? null
}

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
