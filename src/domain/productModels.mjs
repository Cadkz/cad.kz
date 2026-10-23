// 3D-модели оборудования для сцены первого экрана (пробная ветка, 23.10.2026): владелец хочет,
// чтобы сканеры Artec можно было покрутить. Модели сгенерированы нейросетью по официальному фото
// производителя (Higgsfield, Tripo) — мелкие детали могут отличаться от настоящего устройства.
// Файлы лежат в public/models, сжатые (gltf-transform): геометрия meshopt, текстуры WebP.

/**
 * slug товара → адрес модели в public/models. Artec Leo — Tripo H3.1 по фото с artec3d.com
 * (23.10.2026): 44 МБ → 1,9 МБ (gltf-transform optimize: упрощение до 6 %, quantize без декодера, текстуры
 * WebP 1024). artec-leo — slug в демоданных, artec_leo — на сайте.
 * @type {Record<string, string>}
 */
const MODELS = {
  artec_leo: '/models/artec-leo.glb',
  'artec-leo': '/models/artec-leo.glb',
}

/** @param {string} slug @returns {string | null} */
export function productModel(slug) {
  return MODELS[slug] ?? null
}
