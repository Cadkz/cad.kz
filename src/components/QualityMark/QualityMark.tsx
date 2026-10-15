import { Circle } from 'lucide-react'
import type { DefaultCellComponentProps } from 'payload'
import { qualityLevel, qualityText } from '@/domain/quality.mjs'
import styles from './QualityMark.module.css'

type Props = { score: number | null | undefined; gaps: readonly string[] | null | undefined }

/** Отметка заполненности товара: цветная точка, процент и чего не хватает. */
export function QualityMark({ score, gaps }: Props) {
  const level = qualityLevel(score)
  if (level === 'none') return <span className={styles.none}>Ещё не посчитано</span>
  const text = qualityText(gaps)
  return (
    <span className={styles.root} title={text}>
      <Circle
        className={`${styles.dot} ${styles[level]}`}
        size={16}
        strokeWidth={1.75}
        fill="currentColor"
        aria-hidden
      />
      <span className={styles.score}>{score} %</span>
      {level !== 'full' && <span className={styles.text}>{text}</span>}
    </span>
  )
}

function asGaps(value: unknown): string[] {
  return Array.isArray(value) ? value.filter((gap): gap is string => typeof gap === 'string') : []
}

/** Колонка «Заполненность» в списке товаров. */
export function QualityCell({ cellData, rowData }: DefaultCellComponentProps) {
  const score = typeof cellData === 'number' ? cellData : null
  return <QualityMark score={score} gaps={asGaps(rowData.qualityGaps)} />
}
