import { type ReactNode, ViewTransition } from 'react'

/** Общий элемент: картинка и заголовок товара или публикации (src/domain/motion.mjs). */
export type MorphPart = 'media' | 'title'

type Props = {
  /** Ключ товара или публикации; без ключа — обычный элемент без перелёта. */
  id?: string | number | null
  part: MorphPart
  children: ReactNode
}

/**
 * Элемент, который при переходе перелетает со старой страницы на новую (карточка каталога →
 * страница товара, карточка статьи → статья). Пара узнаётся по одинаковому имени на обеих
 * страницах; имя на странице должно быть одно, поэтому ключ ставится только в основной сетке.
 * Остальные переходы (фильтры, меню) общий элемент не трогают — default="none".
 */
export function Morph({ id, part, children }: Props) {
  if (id == null) return children
  return (
    <ViewTransition name={`${part}-${id}`} share="morph" default="none">
      {children}
    </ViewTransition>
  )
}
