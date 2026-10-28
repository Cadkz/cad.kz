// Превью скана из картинки Sketchfab (28.10.2026). У моделей Artec на Sketchfab превью — снимок
// их же плеера на ровном светло-сером фоне (224, 224, 224). Фон, связанный с краем картинки,
// становится прозрачным (заливка от краёв, а не по цвету: серые места самой модели не трогаем),
// пиксели на границе — полупрозрачные, чтобы край не был рваным; плашка «Artec3D Leo» внизу
// убирается. Затем модель вписывается в 640 × 480 с полями — на нашей тёмно-синей подложке.

/** Цвет фона превью Sketchfab у моделей Artec. */
export const POSTER_BACKGROUND = 224
/** Отклонение от фона, которое ещё считается фоном (сжатие JPEG). */
const TOLERANCE = 4
/** На границе: отличие от фона, при котором пиксель уже непрозрачный. */
const EDGE_RANGE = 40

/**
 * Делает фон прозрачным на месте. Возвращает рамку модели или null, если модели не нашлось.
 * @param {Uint8Array | Buffer} rgba пиксели RGBA подряд
 * @param {number} width
 * @param {number} height
 * @returns {{ left: number, top: number, width: number, height: number } | null}
 */
export function keyOutBackground(rgba, width, height) {
  const total = width * height
  const background = new Uint8Array(total)
  const near = (/** @type {number} */ p) =>
    Math.max(
      Math.abs(rgba[p * 4] - POSTER_BACKGROUND),
      Math.abs(rgba[p * 4 + 1] - POSTER_BACKGROUND),
      Math.abs(rgba[p * 4 + 2] - POSTER_BACKGROUND),
    )

  /** @type {number[]} */
  const queue = []
  for (let x = 0; x < width; x++) queue.push(x, (height - 1) * width + x)
  for (let y = 0; y < height; y++) queue.push(y * width, y * width + width - 1)
  while (queue.length > 0) {
    const p = /** @type {number} */ (queue.pop())
    if (background[p] || near(p) > TOLERANCE) continue
    background[p] = 1
    rgba[p * 4 + 3] = 0
    const x = p % width
    if (x > 0) queue.push(p - 1)
    if (x < width - 1) queue.push(p + 1)
    if (p >= width) queue.push(p - width)
    if (p < total - width) queue.push(p + width)
  }

  for (let p = 0; p < total; p++) {
    if (background[p]) continue
    const x = p % width
    const y = (p - x) / width
    const touches =
      (x > 0 && background[p - 1]) ||
      (x < width - 1 && background[p + 1]) ||
      (y > 0 && background[p - width]) ||
      (y < height - 1 && background[p + width])
    if (touches) rgba[p * 4 + 3] = Math.min(255, Math.round((255 * near(p)) / EDGE_RANGE))
  }
  dropLabel(rgba, width, height)
  return contentBox(rgba, width, height)
}

/** Пиксель модели: заметно непрозрачный. */
const SOLID = 24
/** Плашка «Artec3D Leo» внизу превью: мелкие детали целиком в нижней пятой части. */
const LABEL_BAND = 0.8
const LABEL_SHARE = 0.02

/**
 * Убирает плашку с логотипом Artec и названием сканера, которую Sketchfab-превью Artec несут
 * внизу по центру: связные кусочки, целиком лежащие в нижней пятой части и мелкие (меньше 2 %
 * картинки), становятся прозрачными. Сама модель — одна крупная связная область, её не трогаем.
 * @param {Uint8Array | Buffer} rgba @param {number} width @param {number} height
 */
function dropLabel(rgba, width, height) {
  const total = width * height
  const seen = new Uint8Array(total)
  for (let start = 0; start < total; start++) {
    if (seen[start] || rgba[start * 4 + 3] < SOLID) continue
    /** @type {number[]} */
    const part = []
    const queue = [start]
    seen[start] = 1
    let top = height
    while (queue.length > 0) {
      const p = /** @type {number} */ (queue.pop())
      part.push(p)
      const x = p % width
      const y = (p - x) / width
      if (y < top) top = y
      for (let dy = -1; dy <= 1; dy++)
        for (let dx = -1; dx <= 1; dx++) {
          const nx = x + dx
          const ny = y + dy
          if (nx < 0 || ny < 0 || nx >= width || ny >= height) continue
          const q = ny * width + nx
          if (seen[q] || rgba[q * 4 + 3] < SOLID) continue
          seen[q] = 1
          queue.push(q)
        }
    }
    if (top >= height * LABEL_BAND && part.length < total * LABEL_SHARE)
      for (const p of part) rgba[p * 4 + 3] = 0
  }
}

/**
 * Рамка непрозрачных пикселей или null.
 * @param {Uint8Array | Buffer} rgba @param {number} width @param {number} height
 */
function contentBox(rgba, width, height) {
  let left = width
  let top = height
  let right = -1
  let bottom = -1
  for (let p = 0; p < width * height; p++) {
    if (rgba[p * 4 + 3] < SOLID) continue
    const x = p % width
    const y = (p - x) / width
    if (x < left) left = x
    if (x > right) right = x
    if (y < top) top = y
    if (y > bottom) bottom = y
  }
  if (right < 0) return null
  return { left, top, width: right - left + 1, height: bottom - top + 1 }
}

/** Размер превью и поля вокруг модели (доля стороны). */
export const POSTER_SIZE = { width: 640, height: 480, margin: 0.08 }
