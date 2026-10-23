import { NavGroup } from '@payloadcms/ui'
import {
  FolderTree,
  Home,
  Image,
  Inbox,
  type LucideIcon,
  Newspaper,
  ShoppingCart,
  Tags,
} from 'lucide-react'
import type { ServerProps } from 'payload'
import { MAIN_LINKS } from '@/domain/adminMenu.mjs'
import styles from './AdminNavMain.module.css'

const ICONS: Record<string, LucideIcon> = {
  catalog: FolderTree,
  prices: Tags,
  home: Home,
  news: Newspaper,
  orders: ShoppingCart,
  requests: Inbox,
  media: Image,
}

/**
 * «Главное» вверху меню админки: каждодневное крупно и с иконками (src/domain/adminMenu.mjs).
 * Пункт виден, если у человека есть доступ: к коллекции или настройке — право чтения, к своим
 * страницам («Каталог», «Цены») — администратор и маркетолог.
 */
export function AdminNavMain({ user, permissions }: ServerProps) {
  const staff = user?.role === 'admin' || user?.role === 'editor'
  const links = MAIN_LINKS.filter((link) => {
    if (link.collection)
      return Boolean(
        permissions?.collections?.[link.collection as keyof typeof permissions.collections]?.read,
      )
    if (link.global)
      return Boolean(permissions?.globals?.[link.global as keyof typeof permissions.globals]?.read)
    return staff
  })
  if (!links.length) return null
  return (
    <NavGroup label="Главное">
      {links.map((link) => {
        const Icon = ICONS[link.icon] ?? FolderTree
        return (
          <a key={link.href} className={styles.link} href={link.href}>
            <Icon size={20} strokeWidth={1.75} aria-hidden="true" className={styles.icon} />
            {link.label}
          </a>
        )
      })}
    </NavGroup>
  )
}
