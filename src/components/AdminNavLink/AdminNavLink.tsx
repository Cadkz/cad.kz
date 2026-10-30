'use client'

import { usePathname } from 'next/navigation'
import type { ReactNode } from 'react'
import { isActive } from '@/domain/adminMenu.mjs'
import styles from './AdminNavLink.module.css'

type Props = { href: string; children: ReactNode }

/** Пункт меню админки: текущий раздел подсвечен, как у пунктов Payload. */
export function AdminNavLink({ href, children }: Props) {
  const pathname = usePathname() ?? ''
  const active = isActive(href, pathname)
  return (
    <a
      className={`${styles.link} ${active ? styles.active : ''}`}
      href={href}
      aria-current={active ? 'page' : undefined}
    >
      {children}
    </a>
  )
}
