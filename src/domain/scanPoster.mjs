// Превью скана из картинки Sketchfab (28.10.2026). У моделей Artec на Sketchfab превью — снимок
// их же плеера на ровном светло-сером фоне (224, 224, 224). Фон, связанный с краем картинки,
// становится прозрачным (заливка от краёв, а не по цвету: серые места самой модели не трогаем),
// пиксели на границе — полупрозрачные, чтобы край не был рваным. Затем модель вписывается
// в 640 × 480 с полями — так же, как прежние превью, на нашей тёмно-синей подложке.

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

  let left = width
  let top = height
  let right = -1
  let bottom = -1
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
    if (rgba[p * 4 + 3] < 24) continue
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
