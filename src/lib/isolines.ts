/**
 * Изолинии для первого экрана: горизонтали, как на топографической карте, над медленно
 * меняющимся «рельефом». Рельеф — шум Перлина (3D: x, y и время), линии — marching squares.
 * Без библиотек; один кадр 1440 × 700 считается за 1–3 мс.
 */

// Перестановка для шума: фиксированная, чтобы картинка была одинаковой у всех.
const PERM = (() => {
  const p = new Uint8Array(256)
  for (let i = 0; i < 256; i++) p[i] = i
  let seed = 20261021
  for (let i = 255; i > 0; i--) {
    seed = (seed * 1664525 + 1013904223) >>> 0
    const j = seed % (i + 1)
    const tmp = p[i] ?? 0
    p[i] = p[j] ?? 0
    p[j] = tmp
  }
  const out = new Uint8Array(512)
  for (let i = 0; i < 512; i++) out[i] = p[i & 255] ?? 0
  return out
})()

const fade = (t: number) => t * t * t * (t * (t * 6 - 15) + 10)
const lerp = (a: number, b: number, t: number) => a + t * (b - a)
const perm = (i: number) => PERM[i] ?? 0

function grad(hash: number, x: number, y: number, z: number) {
  const h = hash & 15
  const u = h < 8 ? x : y
  const v = h < 4 ? y : h === 12 || h === 14 ? x : z
  return (h & 1 ? -u : u) + (h & 2 ? -v : v)
}

/** Шум Перлина в трёх измерениях, значения примерно от −1 до 1. */
function noise3(x: number, y: number, z: number) {
  const X = Math.floor(x) & 255
  const Y = Math.floor(y) & 255
  const Z = Math.floor(z) & 255
  x -= Math.floor(x)
  y -= Math.floor(y)
  z -= Math.floor(z)
  const u = fade(x)
  const v = fade(y)
  const w = fade(z)
  const A = perm(X) + Y
  const AA = perm(A) + Z
  const AB = perm(A + 1) + Z
  const B = perm(X + 1) + Y
  const BA = perm(B) + Z
  const BB = perm(B + 1) + Z
  return lerp(
    lerp(
      lerp(grad(perm(AA), x, y, z), grad(perm(BA), x - 1, y, z), u),
      lerp(grad(perm(AB), x, y - 1, z), grad(perm(BB), x - 1, y - 1, z), u),
      v,
    ),
    lerp(
      lerp(grad(perm(AA + 1), x, y, z - 1), grad(perm(BA + 1), x - 1, y, z - 1), u),
      lerp(grad(perm(AB + 1), x, y - 1, z - 1), grad(perm(BB + 1), x - 1, y - 1, z - 1), u),
      v,
    ),
    w,
  )
}

/** Шаг сетки в CSS-пикселях: мельче — плавнее линии, но дороже кадр. */
const CELL = 16
/** Размер «холма» рельефа в CSS-пикселях. */
const SCALE = 1 / 260
/** Уровни горизонталей: от LOW с шагом STEP, каждая INDEX-я — утолщённая, как на карте. */
const LOW = -1
const STEP = 0.075
const INDEX = 5

export type IsolineStyle = {
  line: string
  index: string
  /** Плотность пикселей холста (не выше 1,5 — линии и так тонкие). */
  dpr: number
}

/**
 * Рисует один кадр. time — «время» рельефа (меняется медленно), drift — сдвиг по горизонтали
 * в CSS-пикселях: рельеф будто медленно течёт вбок.
 */
export function drawIsolines(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  time: number,
  drift: number,
  style: IsolineStyle,
) {
  const cols = Math.ceil(width / CELL) + 1
  const rows = Math.ceil(height / CELL) + 1
  const field = new Float32Array(cols * rows)
  for (let j = 0; j < rows; j++) {
    for (let i = 0; i < cols; i++) {
      const x = (i * CELL + drift) * SCALE
      const y = j * CELL * SCALE
      field[j * cols + i] =
        noise3(x, y, time) * 0.9 + noise3(x * 2.1 + 7.3, y * 2.1 + 3.1, time * 1.4) * 0.35
    }
  }

  const minor = new Path2D()
  const major = new Path2D()
  const at = (i: number, j: number) => field[j * cols + i] ?? 0

  for (let j = 0; j < rows - 1; j++) {
    for (let i = 0; i < cols - 1; i++) {
      const a = at(i, j) // верхний левый
      const b = at(i + 1, j) // верхний правый
      const c = at(i + 1, j + 1) // нижний правый
      const d = at(i, j + 1) // нижний левый
      const lo = Math.min(a, b, c, d)
      const hi = Math.max(a, b, c, d)
      const first = Math.ceil((lo - LOW) / STEP)
      const last = Math.floor((hi - LOW) / STEP)
      const x0 = i * CELL
      const y0 = j * CELL
      for (let k = first; k <= last; k++) {
        const level = LOW + k * STEP
        traceCell(k % INDEX === 0 ? major : minor, a, b, c, d, level, x0, y0)
      }
    }
  }

  ctx.setTransform(style.dpr, 0, 0, style.dpr, 0, 0)
  ctx.clearRect(0, 0, width, height)
  ctx.lineJoin = 'round'
  ctx.globalAlpha = 0.7
  ctx.strokeStyle = style.line
  ctx.lineWidth = 1
  ctx.stroke(minor)
  ctx.globalAlpha = 0.45
  ctx.strokeStyle = style.index
  ctx.lineWidth = 1.5
  ctx.stroke(major)
  ctx.globalAlpha = 1
}

/** Отрезки горизонтали внутри одной клетки (marching squares с интерполяцией по краям). */
function traceCell(
  path: Path2D,
  a: number,
  b: number,
  c: number,
  d: number,
  level: number,
  x0: number,
  y0: number,
) {
  const mask = (a > level ? 8 : 0) | (b > level ? 4 : 0) | (c > level ? 2 : 0) | (d > level ? 1 : 0)
  if (mask === 0 || mask === 15) return
  const t = (p: number, q: number) => (level - p) / (q - p)
  // Точки на сторонах клетки: верх, право, низ, лево.
  const top = (): [number, number] => [x0 + t(a, b) * CELL, y0]
  const right = (): [number, number] => [x0 + CELL, y0 + t(b, c) * CELL]
  const bottom = (): [number, number] => [x0 + t(d, c) * CELL, y0 + CELL]
  const left = (): [number, number] => [x0, y0 + t(a, d) * CELL]
  const seg = (p: [number, number], q: [number, number]) => {
    path.moveTo(p[0], p[1])
    path.lineTo(q[0], q[1])
  }
  switch (mask) {
    case 1:
    case 14:
      return seg(left(), bottom())
    case 2:
    case 13:
      return seg(bottom(), right())
    case 3:
    case 12:
      return seg(left(), right())
    case 4:
    case 11:
      return seg(top(), right())
    case 6:
    case 9:
      return seg(top(), bottom())
    case 7:
    case 8:
      return seg(left(), top())
    case 5:
      seg(left(), top())
      return seg(bottom(), right())
    case 10:
      seg(top(), right())
      return seg(left(), bottom())
  }
}
