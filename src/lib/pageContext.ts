'use client'

import { usePathname } from 'next/navigation'
import { useEffect, useState } from 'react'
import type { ChatPage } from '@/domain/assistant.mjs'

/**
 * Страница, где открыт чат с Кадди: адрес с параметрами (раздел каталога в них) и заголовок h1.
 * Кадди здоровается про неё и получает её в запросе (замечание владельца 03.11.2026).
 */
export function readPage(): ChatPage | null {
  if (typeof document === 'undefined') return null
  const title = document.querySelector('main h1, h1')?.textContent?.replace(/\s+/g, ' ').trim()
  if (!title) return null
  const path = `${window.location.pathname}${window.location.search}`.slice(0, 200)
  return { path, title: title.slice(0, 120) }
}

/** Та же страница для показа: обновляется при переходе по сайту. */
export function usePageContext() {
  const pathname = usePathname()
  const [page, setPage] = useState<ChatPage | null>(null)
  useEffect(() => {
    // Заголовок новой страницы появляется после отрисовки — читаем на следующем кадре.
    const frame = requestAnimationFrame(() => setPage(pathname ? readPage() : null))
    return () => cancelAnimationFrame(frame)
  }, [pathname])
  return page
}
