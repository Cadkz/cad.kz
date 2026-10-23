// 3D-модели оборудования для сцены первого экрана (пробная ветка, 23.10.2026): владелец хочет,
// чтобы сканеры Artec можно было покрутить. Модели сгенерированы нейросетью по официальному фото
// производителя (Higgsfield, Tripo) — мелкие детали могут отличаться от настоящего устройства.
// Файлы лежат в public/models, сжатые (gltf-transform): геометрия meshopt, текстуры WebP.

/**
 * slug товара → адрес модели в public/models. Первая — Artec Leo (artec_leo), файл ждём от
 * владельца: сервис отдаёт модель только по ссылке, из облачной среды её не скачать.
 * @type {Record<string, string>}
 */
const MODELS = {}

/** @param {string} slug @returns {string | null} */
export function productModel(slug) {
  return MODELS[slug] ?? null
}
