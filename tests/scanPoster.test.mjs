import assert from 'node:assert/strict'
import { test } from 'node:test'
import { keyOutBackground, POSTER_BACKGROUND } from '../src/domain/scanPoster.mjs'

/** Картинка 6 × 4: фон, внутри серый квадрат 2 × 2. */
function picture() {
  const width = 6
  const height = 4
  const rgba = new Uint8Array(width * height * 4)
  for (let p = 0; p < width * height; p++)
    rgba.set([POSTER_BACKGROUND, POSTER_BACKGROUND, POSTER_BACKGROUND, 255], p * 4)
  for (const [x, y] of [
    [2, 1],
    [3, 1],
    [2, 2],
    [3, 2],
  ])
    rgba.set([90, 90, 90, 255], (y * width + x) * 4)
  return { rgba, width, height }
}

test('фон от краёв становится прозрачным, модель остаётся, рамка — по модели', () => {
  const { rgba, width, height } = picture()
  const box = keyOutBackground(rgba, width, height)
  assert.deepEqual(box, { left: 2, top: 1, width: 2, height: 2 })
  assert.equal(rgba[3], 0)
  assert.equal(rgba[(1 * width + 2) * 4 + 3], 255)
})

test('серое внутри модели, не связанное с краем, не вырезается', () => {
  const width = 5
  const height = 5
  const rgba = new Uint8Array(width * height * 4)
  for (let p = 0; p < width * height; p++) {
    const x = p % width
    const y = Math.floor(p / width)
    const ring = x >= 1 && x <= 3 && y >= 1 && y <= 3
    const value = ring && !(x === 2 && y === 2) ? 60 : POSTER_BACKGROUND
    rgba.set([value, value, value, 255], p * 4)
  }
  keyOutBackground(rgba, width, height)
  assert.equal(rgba[(2 * width + 2) * 4 + 3], 255)
})

test('пустая картинка — модели нет', () => {
  const rgba = new Uint8Array(4 * 4 * 4).fill(POSTER_BACKGROUND)
  assert.equal(keyOutBackground(rgba, 4, 4), null)
})

test('мелкая плашка внизу (логотип Artec) убирается, рамка — только по модели', () => {
  const width = 20
  const height = 20
  const rgba = new Uint8Array(width * height * 4)
  for (let p = 0; p < width * height; p++) {
    const x = p % width
    const y = Math.floor(p / width)
    const model = x >= 4 && x <= 15 && y >= 2 && y <= 13
    const label = x === 9 && y === 18
    const value = model || label ? 80 : POSTER_BACKGROUND
    rgba.set([value, value, value, 255], p * 4)
  }
  const box = keyOutBackground(rgba, width, height)
  assert.deepEqual(box, { left: 4, top: 2, width: 12, height: 12 })
  assert.equal(rgba[(18 * width + 9) * 4 + 3], 0)
})
