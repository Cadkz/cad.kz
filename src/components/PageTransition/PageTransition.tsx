import { type ReactNode, ViewTransition } from 'react'

const DIRECTION = { 'nav-forward': 'nav-forward', 'nav-back': 'nav-back', default: 'none' }

/**
 * Содержимое страницы между шапкой и подвалом. Переход вглубь (карточка → товар, статья) —
 * старая страница уходит чуть влево, новая приходит справа; назад (хлебные крошки) — наоборот.
 * Шапка и подвал не двигаются. Остальные переходы — без анимации (src/domain/motion.mjs).
 */
export function PageTransition({ children }: { children: ReactNode }) {
  return (
    <ViewTransition default={DIRECTION} name="page">
      {children}
    </ViewTransition>
  )
}
