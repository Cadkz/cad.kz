'use client'

import { type MouseEvent, type ReactNode, useEffect, useRef } from 'react'
import { sendSearchEvent } from '@/lib/sendSearchEvent'
import styles from './SearchTracker.module.css'

type Props = {
  query: string
  /** Сколько нашлось точно по запросу; «похожее» вместо точного считается как 0. */
  found: number
  children: ReactNode
}

/**
 * Аналитика страницы поиска: один раз за показ отправляет запрос, сколько нашлось и куда
 * перешли из результатов (карточка, WhatsApp, Кадди). Не перешли никуда — отправляет, когда
 * человек уходит со страницы или закрывает вкладку. Сам ничего не рисует.
 */
export function SearchTracker({ query, found, children }: Props) {
  // Для какого запроса уже отправлено (переход или уход со страницы).
  const sentFor = useRef<string | null>(null)
  // Отправка при уходе откладывается на миг: если тот же запрос сразу смонтировался снова
  // (повторный запуск эффектов в режиме разработки), она отменяется.
  const leaving = useRef<{ query: string; timer: ReturnType<typeof setTimeout> } | null>(null)

  // biome-ignore lint/correctness/useExhaustiveDependencies: новый запрос — новый подсчёт
  useEffect(() => {
    if (leaving.current?.query === query) clearTimeout(leaving.current.timer)
    leaving.current = null
    const flush = () => {
      if (sentFor.current === query) return
      sentFor.current = query
      sendSearchEvent({ query, found, source: 'page', click: null })
    }
    const onHide = () => {
      if (document.visibilityState === 'hidden') flush()
    }
    document.addEventListener('visibilitychange', onHide)
    return () => {
      document.removeEventListener('visibilitychange', onHide)
      leaving.current = { query, timer: setTimeout(flush) }
    }
  }, [query])

  function onClick(event: MouseEvent<HTMLDivElement>) {
    if (sentFor.current === query || !(event.target instanceof Element)) return
    const target = event.target.closest<HTMLElement>('a[href], [data-search-click]')
    if (!target) return
    let click: string | null = target.dataset.searchClick ?? null
    if (!click && target instanceof HTMLAnchorElement)
      click = target.origin === window.location.origin ? target.pathname : 'whatsapp'
    if (!click) return
    sentFor.current = query
    sendSearchEvent({ query, found, source: 'page', click })
  }

  return (
    <div className={styles.root} onClickCapture={onClick}>
      {children}
    </div>
  )
}
