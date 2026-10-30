import { DefaultNav } from '@payloadcms/next/rsc'
import type { ComponentProps } from 'react'

/** Свои группы Payload не выводит: всё меню рисует `AdminNavMain` (src/domain/adminMenu.mjs). */
const NOTHING = { collections: [], globals: [] }

/**
 * Меню админки: оболочка Payload (сворачивание, выход), но без его групп коллекций — иначе
 * каждый пункт встречался бы дважды. Пункты по задачам — в `AdminNavMain` (beforeNavLinks).
 */
export function AdminNav(props: ComponentProps<typeof DefaultNav>) {
  return <DefaultNav {...props} visibleEntities={NOTHING} />
}
