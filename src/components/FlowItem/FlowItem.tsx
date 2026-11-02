import { type ReactNode, ViewTransition } from 'react'
import { CATALOG_FILTER } from '@/domain/motion.mjs'

const MOVE = { [CATALOG_FILTER]: 'grid-move', default: 'none' }
const IN = { [CATALOG_FILTER]: 'grid-in', default: 'none' }
const OUT = { [CATALOG_FILTER]: 'grid-out', default: 'none' }

type Props = {
  children: ReactNode
  /** Много карточек — без перелёта: элемент остаётся обычным. */
  still?: boolean
}

/**
 * Карточка сетки каталога при смене условий (этап 2 анимаций, 02.11.2026): оставшаяся переезжает
 * на новое место, ушедшая гаснет с лёгким уменьшением, новая проступает. Только для переходов
 * с типом catalog-filter — листание страниц, «Назад» и переходы между страницами её не трогают.
 */
export function FlowItem({ children, still = false }: Props) {
  if (still) return children
  return (
    <ViewTransition default="none" update={MOVE} enter={IN} exit={OUT}>
      {children}
    </ViewTransition>
  )
}
