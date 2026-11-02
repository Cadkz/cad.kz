import { type ReactNode, ViewTransition } from 'react'

/**
 * Общий элемент: картинка товара. Перелёт заголовков пробовали и убрали (владелец 02.11.2026:
 * перенос строк в полёте выглядит дёргано) — заголовок едет вместе со страницей.
 */
export type MorphPart = 'media'

type Props = {
  /** Ключ товара или публикации; без ключа — обычный элемент без перелёта. */
  id?: string | number | null
  part: MorphPart
  children: ReactNode
}

/**
 * Элемент, который при переходе перелетает со старой страницы на новую (картинка карточки
 * каталога → лист страницы товара). Пара узнаётся по одинаковому имени на обеих
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
