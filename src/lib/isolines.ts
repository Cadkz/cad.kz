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
const CELL = 14
/** Размер «холма» рельефа в CSS-пикселях. */
const SCALE = 1 / 280
/** Уровни горизонталей: от LOW с шагом STEP, каждая INDEX-я — утолщённая, как на карте. */
const LOW = -2
const STEP = 0.075
const INDEX = 5
/** Холм под курсором: высота и ширина (сигма, CSS-пиксели) — вокруг него кольца горизонталей. */
const BUMP_HEIGHT = 0.9
const BUMP_SIGMA = 110

export type IsolineStyle = {
  line: string
  index: string
  /** Плотность пикселей холста (не выше 1,5 — линии и так тонкие). */
  dpr: number
}

export type IsolineFrame = {
  width: number
  height: number
  /** «Время» рельефа — меняется медленно. */
  time: number
  /** Сдвиг рельефа вбок в CSS-пикселях: будто медленно течёт. */
  drift: number
  /** Точка света и холма (курсор или блуждающая точка), CSS-пиксели. */
  focusX: number
  focusY: number
  /** Появление при загрузке: 0 — ничего, 1 — всё; линии расходятся кругом от точки света. */
  reveal: number
}

/** #1f3da8 → rgba(31, 61, 168, a) — для градиентов холста. */
function withAlpha(hex: string, alpha: number) {
  const m = /^#?([0-9a-f]{6})$/i.exec(hex.trim())
  if (!m?.[1]) return hex
  const n = Number.parseInt(m[1], 16)
  return `rgba(${(n >> 16) & 255}, ${(n >> 8) & 255}, ${n & 255}, ${alpha})`
}

/**
 * Блуждающая точка света, когда курсора нет (телефон, мышь вне блока): медленная восьмёрка
 * в правой половине, где картинка, а не текст.
 */
export function wanderPoint(width: number, height: number, seconds: number): [number, number] {
  const wide = width >= 960
  const cx = wide ? width * 0.7 : width * 0.6
  // На телефоне — над картинкой BIM в верху блока, не над текстом.
  const cy = wide ? height * 0.45 : Math.min(height * 0.12, 150)
  return [
    cx + width * (wide ? 0.14 : 0.25) * Math.sin(seconds * 0.23),
    cy + (wide ? height * 0.2 : 40) * Math.sin(seconds * 0.37 + 1),
  ]
}

/** Рисует один кадр. */
export function drawIsolines(ctx: CanvasRenderingContext2D, f: IsolineFrame, style: IsolineStyle) {
  const { width, height } = f
  const cols = Math.ceil(width / CELL) + 1
  const rows = Math.ceil(height / CELL) + 1
  const field = new Float32Array(cols * rows)
  const twoSigma2 = 2 * BUMP_SIGMA * BUMP_SIGMA
  for (let j = 0; j < rows; j++) {
    const py = j * CELL
    const dy = py - f.focusY
    for (let i = 0; i < cols; i++) {
      const px = i * CELL
      const x = (px + f.drift) * SCALE
      const y = py * SCALE
      const dx = px - f.focusX
      field[j * cols + i] =
        noise3(x, y, f.time) * 0.9 +
        noise3(x * 2.1 + 7.3, y * 2.1 + 3.1, f.time * 1.4) * 0.35 +
        BUMP_HEIGHT * Math.exp(-(dx * dx + dy * dy) / twoSigma2)
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
        traceCell(k % INDEX === 0 ? major : minor, a, b, c, d, LOW + k * STEP, x0, y0)
      }
    }
  }

  const reach = Math.hypot(width, height)
  const light = (inner: number, mid: number, outer: number, color: string, glow: string) => {
    const g = ctx.createRadialGradient(f.focusX, f.focusY, 0, f.focusX, f.focusY, reach * 0.55)
    g.addColorStop(0, withAlpha(glow, inner))
    g.addColorStop(0.16, withAlpha(color, mid))
    g.addColorStop(1, withAlpha(color, outer))
    return g
  }

  ctx.setTransform(style.dpr, 0, 0, style.dpr, 0, 0)
  ctx.globalCompositeOperation = 'source-over'
  ctx.clearRect(0, 0, width, height)

  // Мягкое пятно света под линиями — будто карту подсветили фонариком.
  const spot = ctx.createRadialGradient(f.focusX, f.focusY, 0, f.focusX, f.focusY, 260)
  spot.addColorStop(0, withAlpha(style.index, 0.2))
  spot.addColorStop(1, withAlpha(style.index, 0))
  ctx.fillStyle = spot
  ctx.fillRect(0, 0, width, height)

  ctx.lineJoin = 'round'
  ctx.lineCap = 'round'
  ctx.lineWidth = 1
  ctx.strokeStyle = light(0.9, 0.7, 0.22, style.line, style.index)
  ctx.stroke(minor)
  ctx.lineWidth = 1.6
  ctx.strokeStyle = light(1, 0.6, 0.16, style.index, style.index)
  ctx.stroke(major)

  // Появление: линии проявляются кругом, расходящимся от точки света.
  if (f.reveal < 1) {
    const r = Math.max(1, f.reveal * reach)
    const mask = ctx.createRadialGradient(f.focusX, f.focusY, r * 0.6, f.focusX, f.focusY, r)
    mask.addColorStop(0, 'rgba(0, 0, 0, 1)')
    mask.addColorStop(1, 'rgba(0, 0, 0, 0)')
    ctx.globalCompositeOperation = 'destination-in'
    ctx.fillStyle = mask
    ctx.fillRect(0, 0, width, height)
    ctx.globalCompositeOperation = 'source-over'
  }
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
