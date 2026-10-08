import type { ReactNode } from 'react'
import styles from './Grid.module.css'

type Span = 3 | 4 | 6 | 8 | 12
type Props = {
  children: ReactNode
  className?: string
  /** Сколько из 12 колонок занимает каждый блок: на телефоне, от 640, от 960 px. */
  span?: { base?: Span; sm?: Span; md?: Span }
  as?: 'div' | 'ul'
}

/**
 * 12-колоночная сетка внутри рамки. Каждый прямой потомок занимает целое число колонок.
 * Например span={{ base: 12, sm: 6, md: 4 }} — одна, две, три карточки в ряд.
 */
export function Grid({ children, className, span = { base: 12 }, as: Tag = 'div' }: Props) {
  const classes = [
    styles.grid,
    styles[`base${span.base ?? 12}`],
    span.sm && styles[`sm${span.sm}`],
    span.md && styles[`md${span.md}`],
    className,
  ]
  return <Tag className={classes.filter(Boolean).join(' ')}>{children}</Tag>
}

/** Отдельный блок сетки со своей шириной: для раскладок 8 + 4, 6 + 6 и т. п. */
export function Col({
  children,
  className,
  span = { base: 12 },
}: {
  children: ReactNode
  className?: string
  span?: { base?: Span; sm?: Span; md?: Span }
}) {
  const classes = [
    styles[`colBase${span.base ?? 12}`],
    span.sm && styles[`colSm${span.sm}`],
    span.md && styles[`colMd${span.md}`],
    className,
  ]
  return <div className={classes.filter(Boolean).join(' ')}>{children}</div>
}
