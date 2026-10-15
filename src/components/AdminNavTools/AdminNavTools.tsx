import { NavGroup } from '@payloadcms/ui'
import type { ServerProps } from 'payload'
import styles from './AdminNavTools.module.css'

type Tool = { label: string; href: string; adminOnly?: boolean }

/** Свои страницы админки: в меню Payload их не добавить в группы, поэтому — отдельная группа. */
const TOOLS: Tool[] = [
  { label: 'Загрузить прайс', href: '/admin/price-list' },
  { label: 'Прайс и база Кадди', href: '/admin/kaddi-data' },
  { label: 'Проверка Кадди', href: '/admin/assistant-check' },
  { label: 'Импорт из Битрикса', href: '/admin/import-bitrix', adminOnly: true },
  { label: 'Перенос со старого сайта', href: '/admin/legacy-content', adminOnly: true },
]

/**
 * Группа «Инструменты» в конце меню: загрузка прайса и страницы Кадди — администратору и
 * маркетологу, импорт и перенос — только администратору.
 */
export function AdminNavTools({ user }: ServerProps) {
  if (user?.role !== 'admin' && user?.role !== 'editor') return null
  const tools = TOOLS.filter((tool) => !tool.adminOnly || user.role === 'admin')
  return (
    <NavGroup label="Инструменты">
      {tools.map((tool) => (
        <a key={tool.href} className={styles.link} href={tool.href}>
          {tool.label}
        </a>
      ))}
    </NavGroup>
  )
}
