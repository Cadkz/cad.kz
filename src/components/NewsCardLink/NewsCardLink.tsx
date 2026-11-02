'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { type MouseEvent, type ReactNode, useEffect, useRef } from 'react'
import styles from './NewsCardLink.module.css'

type Props = { href: string; className?: string; children: ReactNode }

/** Значение токена из tokens.css: длительность в мс или кривая. */
function token(name: string) {
  return getComputedStyle(document.documentElement)
    .getPropertyValue(name)
    .replace(/\s+/g, ' ')
    .trim()
}
/** Длительность из токена в мс: сборка сжимает «380ms» в «.38s». */
function ms(name: string) {
  const value = token(name)
  const number = Number.parseFloat(value) || 0
  return value.endsWith('ms') ? number : number * 1000
}

/**
 * Ссылка карточки новости или статьи. По нажатию копия карточки раскрывается на весь экран, как
 * приложение в iOS, и сразу начинается переход; когда новая страница на месте (эта ссылка
 * исчезает вместе со старой), заливка тает. Ctrl/Cmd, средняя кнопка и «меньше движения» —
 * обычная ссылка.
 */
export function NewsCardLink({ href, className, children }: Props) {
  const router = useRouter()
  const overlay = useRef<{ node: HTMLElement; grow: Animation } | null>(null)

  useEffect(
    () => () => {
      const current = overlay.current
      if (!current) return
      current.grow.finished
        .catch(() => undefined)
        .then(() => {
          const fade = current.node.animate([{ opacity: 1 }, { opacity: 0 }], {
            duration: ms('--duration-card-reveal'),
            easing: 'ease-out',
            fill: 'forwards',
          })
          return fade.finished
        })
        .finally(() => current.node.remove())
    },
    [],
  )

  const open = (event: MouseEvent<HTMLAnchorElement>) => {
    if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey)
      return
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    const card = event.currentTarget.closest('article')
    if (!card || overlay.current) return
    event.preventDefault()
    const rect = card.getBoundingClientRect()
    const radius = getComputedStyle(card).borderRadius
    const node = document.createElement('div')
    node.className = styles.overlay
    const copy = card.cloneNode(true)
    if (copy instanceof HTMLElement) copy.classList.add(styles.copy)
    node.append(copy)
    document.body.append(node)
    const duration = ms('--duration-card-open')
    const easing = token('--ease-ios') || 'ease-out'
    const grow = node.animate(
      [
        {
          top: `${rect.top}px`,
          left: `${rect.left}px`,
          width: `${rect.width}px`,
          height: `${rect.height}px`,
          borderRadius: radius,
          backgroundColor: token('--color-surface'),
        },
        {
          top: '0px',
          left: '0px',
          width: '100vw',
          height: '100vh',
          borderRadius: '0px',
          backgroundColor: token('--color-bg'),
        },
      ],
      { duration, easing, fill: 'forwards' },
    )
    if (copy instanceof HTMLElement)
      copy.animate([{ opacity: 1 }, { opacity: 0 }], {
        duration: duration * 0.6,
        easing: 'ease-out',
        fill: 'forwards',
      })
    overlay.current = { node, grow }
    router.push(href)
    // Переход не случился (ошибка, та же страница) — убрать заливку, чтобы не закрыла сайт.
    window.setTimeout(() => {
      if (overlay.current?.node.isConnected && document.contains(card)) {
        overlay.current.node.remove()
        overlay.current = null
      }
    }, 8000)
  }

  return (
    <Link href={href} className={className} onClick={open}>
      {children}
    </Link>
  )
}
