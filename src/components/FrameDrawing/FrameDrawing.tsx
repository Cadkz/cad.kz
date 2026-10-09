import styles from './FrameDrawing.module.css'

/* Каркас здания 3 × 2 пролёта, 3 этажа, в изометрии (как вид в Revit или SCAD). Точки посчитаны
 * заранее: x и y по осям здания, проекция под 30°. */
const FRAME =
  'M150 120L150 12.9M120.6 137L120.6 29.9M91.1 154L91.1 46.9M179.4 137L179.4 29.9M150 154L150 46.9M120.6 171L120.6 63.9M208.9 154L208.9 46.9M179.4 171L179.4 63.9M150 188L150 80.9M238.3 171L238.3 63.9M208.9 188L208.9 80.9M179.4 205L179.4 97.9M150 84.3L238.3 135.3M120.6 101.3L208.9 152.3M91.1 118.3L179.4 169.3M150 84.3L91.1 118.3M179.4 101.3L120.6 135.3M208.9 118.3L150 152.3M238.3 135.3L179.4 169.3M150 48.6L238.3 99.6M120.6 65.6L208.9 116.6M91.1 82.6L179.4 133.6M150 48.6L91.1 82.6M179.4 65.6L120.6 99.6M208.9 82.6L150 116.6M238.3 99.6L179.4 133.6M150 12.9L238.3 63.9M120.6 29.9L208.9 80.9M91.1 46.9L179.4 97.9M150 12.9L91.1 46.9M179.4 29.9L120.6 63.9M208.9 46.9L150 80.9M238.3 63.9L179.4 97.9'
const BRACING = 'M120.6 171L150 152.3M150 188L120.6 135.3'
const GROUND =
  'M150 120L238.3 171M238.3 171L179.4 205M179.4 205L91.1 154M91.1 154L150 120M179.4 137L120.6 171M208.9 154L150 188M120.6 137L208.9 188'
const DIMENSION =
  'M70.5 165.9L158.8 216.9M86.7 156.6L66.1 168.4M175 207.6L154.4 219.4M66.5 169.9L74.5 161.9M154.8 220.9L162.8 212.9'

/**
 * Чертёж каркаса для тёмных баннеров: линии прорисовываются один раз при появлении страницы.
 * Чисто декоративный (aria-hidden), рисуется кодом, без картинки.
 */
export function FrameDrawing({ className }: { className?: string }) {
  return (
    <svg
      className={[styles.drawing, className].filter(Boolean).join(' ')}
      viewBox="56 0 196 232"
      fill="none"
      aria-hidden="true"
      focusable="false"
    >
      <path className={styles.ground} d={GROUND} pathLength={1} />
      <path className={styles.frame} d={FRAME} pathLength={1} />
      <path className={styles.bracing} d={BRACING} pathLength={1} />
      <path className={styles.dimension} d={DIMENSION} pathLength={1} />
      <text className={styles.label} x="114.7" y="187" transform="rotate(30 114.7 187)">
        12 000
      </text>
    </svg>
  )
}
