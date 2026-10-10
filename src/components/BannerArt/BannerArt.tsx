import styles from './BannerArt.module.css'
import { DRAWINGS, type DrawingName } from './drawings'

type Props = {
  name: DrawingName
  className?: string
  /**
   * Баннер ниже первого экрана: чертёж прорисовывается, пока баннер входит в экран при
   * прокрутке, а не сразу при загрузке, когда его ещё никто не видит.
   */
  onScroll?: boolean
}

/**
 * Линейный чертёж для тёмного баннера: прорисовывается один раз при появлении страницы
 * (или при прокрутке до баннера — onScroll). Декоративный (aria-hidden), кодом, без картинки.
 * Размер и место задаёт баннер через className обёртки: чертёж занимает её ширину целиком.
 */
export function BannerArt({ name, className, onScroll = false }: Props) {
  const drawing = DRAWINGS[name]
  const classes = [className, onScroll && styles.scroll].filter(Boolean).join(' ')
  return (
    <div className={classes || undefined} aria-hidden="true">
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
