import type { ReactNode } from 'react'
import styles from './StickyAside.module.css'

type Props = { children: ReactNode; className?: string }

/**
 * Липкая колонка покупки (замечания владельца 03.11.2026): карточка и условия покупки едут вниз
 * вместе, верх всегда под шапкой — карточка с ценой видна целиком. Если колонка выше экрана, низ
 * условий уходит за нижний край экрана, а не карточка — под шапку. Без своей полосы прокрутки.
 */
export function StickyAside({ children, className }: Props) {
  return <div className={`${styles.sticky} ${className ?? ''}`}>{children}</div>
}
