import styles from './BannerArt.module.css'
import { DRAWINGS, type DrawingName } from './drawings'

/**
 * Линейный чертёж для тёмного баннера: прорисовывается один раз при появлении страницы.
 * Декоративный (aria-hidden), кодом, без картинки. Размер и место задаёт баннер через
 * className обёртки: сам чертёж занимает её ширину целиком.
 */
export function BannerArt({ name, className }: { name: DrawingName; className?: string }) {
  const drawing = DRAWINGS[name]
  return (
    <div className={className} aria-hidden="true">
      <svg
        className={styles.svg}
        viewBox={drawing.viewBox}
        fill="none"
        aria-hidden="true"
        focusable="false"
      >
        {drawing.parts.map((part) => (
          <path
            key={part.d}
            d={part.d}
            pathLength={1}
            className={[styles.path, styles[part.line], part.delay && styles.late]
              .filter(Boolean)
              .join(' ')}
          />
        ))}
        {drawing.labels.map((label) => (
          <text
            key={label.text}
            x={label.x}
            y={label.y}
            className={styles.label}
            transform={label.rotate ? `rotate(${label.rotate} ${label.x} ${label.y})` : undefined}
          >
            {label.text}
          </text>
        ))}
      </svg>
    </div>
  )
}
