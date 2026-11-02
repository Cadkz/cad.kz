'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import type { MouseEvent, ReactNode } from 'react'

/** Длительность разворота карточки — как --duration-card-open в tokens.css. */
const OPEN_MS = 280

type Props = { href: string; className?: string; children: ReactNode }

/**
 * Ссылка карточки новости или статьи: по нажатию карточка разворачивается (data-opening, CSS в
 * NewsCard), через OPEN_MS — переход. Одно нажатие, как обычная ссылка. Открытие в новой
 * вкладке (Ctrl, Cmd, средняя кнопка) и отключённая в системе анимация — без задержки.
 */
export function NewsCardLink({ href, className, children }: Props) {
  const router = useRouter()
  const open = (event: MouseEvent<HTMLAnchorElement>) => {
    if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey)
      return
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    const card = event.currentTarget.closest('article')
    if (!card) return
    event.preventDefault()
    router.prefetch(href)
    card.dataset.opening = 'true'
    window.setTimeout(() => router.push(href), OPEN_MS)
  }
  return (
    <Link href={href} className={className} onClick={open}>
      {children}
    </Link>
  )
}
