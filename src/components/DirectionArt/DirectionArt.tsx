import styles from './DirectionArt.module.css'
import { ART_ALIASES, DIRECTION_ART } from './drawings'

type Props = { slug: string; className?: string }

/** Есть ли у раздела свой чертёж (иначе карточка показывает фото или значок). */
export function hasDirectionArt(slug: string) {
  return Boolean(DIRECTION_ART[ART_ALIASES[slug] ?? slug])
}

/**
 * Чертёж направления на светлой миллиметровке: по картинке понятно, о чём раздел, даже без
 * языка (замечание владельца 27.10.2026). Декоративный (aria-hidden), кодом, без файла.
 */
export function DirectionArt({ slug, className }: Props) {
  const parts = DIRECTION_ART[ART_ALIASES[slug] ?? slug]
  if (!parts) return null
  return (
    <svg
      className={[styles.svg, className].filter(Boolean).join(' ')}
      viewBox="0 0 240 150"
      fill="none"
      aria-hidden="true"
      focusable="false"
    >
      <defs>
        <clipPath id={`art-${slug}`}>
          <rect width="240" height="150" />
        </clipPath>
      </defs>
      <g clipPath={`url(#art-${slug})`}>
        {parts.map((part) => (
          <path key={part.d} d={part.d} className={styles[part.kind]} />
        ))}
      </g>
    </svg>
  )
}
