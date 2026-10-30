import { NavGroup } from '@payloadcms/ui'
import type { ServerProps } from 'payload'
import { KADDI_LINKS, MORE_COLLECTIONS, MORE_GLOBALS } from '@/domain/adminMenu.mjs'
import styles from './AdminNavTools.module.css'

type Tool = { label: string; href: string; adminOnly?: boolean }

/**
 * Свои страницы админки: в меню Payload их не добавить в группы, поэтому — отдельная группа.
 * «Каталог» и «Цены» — в «Главном» сверху (`AdminNavMain`).
 */
const TOOLS: Tool[] = [
  { label: 'Загрузить прайс', href: '/admin/price-list' },
  { label: 'Курсы валют', href: '/admin/rates' },
  { label: 'Контроль качества', href: '/admin/quality' },
  { label: 'Битрикс24', href: '/admin/bitrix24', adminOnly: true },
  { label: 'Импорт из Битрикса', href: '/admin/import-bitrix', adminOnly: true },
  { label: 'Перенос со старого сайта', href: '/admin/legacy-content', adminOnly: true },
]

const label = (value: unknown, fallback: string) => (typeof value === 'string' ? value : fallback)

/**
 * Низ меню: «Кадди» (проверка, база знаний, прайс и диалоги вместе), «Инструменты» (загрузка прайса, курсы, Кадди — администратору и маркетологу,
 * Битрикс24, импорт и перенос — только администратору) и свёрнутое «Ещё» — редкие и
 * технические списки (src/domain/adminMenu.mjs), которые раньше занимали полменю.
 */
export function AdminNavTools({ user, payload, permissions }: ServerProps) {
  if (user?.role !== 'admin' && user?.role !== 'editor') return null
  const tools = TOOLS.filter((tool) => !tool.adminOnly || user.role === 'admin')
  const kaddi = KADDI_LINKS.filter(
    (link) =>
      !link.collection ||
      permissions?.collections?.[link.collection as keyof typeof permissions.collections]?.read,
  )
  const more = [
    ...MORE_COLLECTIONS.flatMap((slug) => {
      const collection = payload.collections[slug as keyof typeof payload.collections]
      const allowed = permissions?.collections?.[slug as keyof typeof permissions.collections]?.read
      if (!collection || !allowed) return []
      const name = label(collection.config.labels.plural, slug)
      return [{ label: name, href: `/admin/collections/${slug}` }]
    }),
    ...MORE_GLOBALS.flatMap((slug) => {
      const global = payload.config.globals.find((item) => item.slug === slug)
      const allowed = permissions?.globals?.[slug as keyof typeof permissions.globals]?.read
      if (!global || !allowed) return []
      return [{ label: label(global.label, slug), href: `/admin/globals/${slug}` }]
    }),
  ]
  return (
    <>
      <NavGroup label="Кадди">
        {kaddi.map((link) => (
          <a key={link.href} className={styles.link} href={link.href}>
            {link.label}
          </a>
        ))}
      </NavGroup>
      <NavGroup label="Инструменты">
        {tools.map((tool) => (
          <a key={tool.href} className={styles.link} href={tool.href}>
            {tool.label}
          </a>
        ))}
      </NavGroup>
      {more.length > 0 && (
        <NavGroup label="Ещё (редко нужно)" isOpen={false}>
          {more.map((item) => (
            <a key={item.href} className={styles.link} href={item.href}>
              {item.label}
            </a>
          ))}
        </NavGroup>
      )}
    </>
  )
}
