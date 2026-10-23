import { DefaultNav } from '@payloadcms/next/rsc'
import type { ComponentProps } from 'react'
import { groupEntities } from '@/domain/adminMenu.mjs'

/**
 * Меню админки: обычное меню Payload, но без пунктов, которые стоят в «Главном» (сверху, с
 * иконками — `AdminNavMain`) и в свёрнутом «Ещё» (снизу — `AdminNavTools`). Так каждый пункт
 * встречается в меню один раз (src/domain/adminMenu.mjs).
 */
export function AdminNav(props: ComponentProps<typeof DefaultNav>) {
  const visible = props.visibleEntities ?? { collections: [], globals: [] }
  return <DefaultNav {...props} visibleEntities={groupEntities(visible)} />
}
