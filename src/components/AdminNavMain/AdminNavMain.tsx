import { NavGroup } from '@payloadcms/ui'
import {
  BookOpen,
  ClipboardCheck,
  Database,
  FileText,
  FolderTree,
  House,
  Image,
  Inbox,
  LayoutDashboard,
  ListChecks,
  type LucideIcon,
  MessagesSquare,
  Newspaper,
  PanelBottom,
  ShoppingCart,
  Tag,
  Tags,
} from 'lucide-react'
import type { ServerProps } from 'payload'
import { AdminNavLink } from '@/components/AdminNavLink/AdminNavLink'
import { HOME_LINK, type MenuLink, visibleMenu } from '@/domain/adminMenu.mjs'
import styles from './AdminNavMain.module.css'

const ICONS: Record<string, LucideIcon> = {
  dashboard: LayoutDashboard,
  catalog: FolderTree,
  prices: Tags,
  quality: ListChecks,
  news: Newspaper,
  pages: FileText,
  home: House,
  footer: PanelBottom,
  topics: Tag,
  media: Image,
  requests: Inbox,
  orders: ShoppingCart,
  dialogs: MessagesSquare,
  knowledge: BookOpen,
  check: ClipboardCheck,
  data: Database,
}

function Item({ link }: { link: MenuLink }) {
  const Icon = link.icon ? ICONS[link.icon] : undefined
  return (
    <AdminNavLink href={link.href}>
      {Icon && <Icon size={20} strokeWidth={1.75} aria-hidden="true" className={styles.icon} />}
      {link.label}
    </AdminNavLink>
  )
}

/**
 * Всё меню админки по задачам (src/domain/adminMenu.mjs): Главная, Каталог, Контент, Продажи,
 * Кадди и свёрнутые Настройки. Человек видит только то, к чему у него есть доступ.
 */
export function AdminNavMain({ user, permissions }: ServerProps) {
  const collections: Record<string, { read?: boolean } | undefined> = permissions?.collections ?? {}
  const globals: Record<string, { read?: boolean } | undefined> = permissions?.globals ?? {}
  const groups = visibleMenu({
    role: typeof user?.role === 'string' ? user.role : undefined,
    canRead: (kind, slug) => Boolean((kind === 'collection' ? collections : globals)[slug]?.read),
  })
  return (
    <>
      <div className={styles.home}>
        <Item link={HOME_LINK} />
      </div>
      {groups.map((group) => (
        <NavGroup key={group.label} label={group.label} isOpen={!group.collapsed}>
          {group.links.map((link) => (
            <Item key={link.href} link={link} />
          ))}
        </NavGroup>
      ))}
    </>
  )
}
