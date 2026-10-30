import type { CollectionSlug, Payload, Where } from 'payload'
import { matchPages, SEARCH_COLLECTIONS, SEARCH_LIMIT, shortLabel } from '@/domain/adminSearch.mjs'

export type SearchHit = { label: string; note?: string; href: string }
export type SearchGroup = { label: string; hits: SearchHit[] }

type SearchUser = { id: number | string; role?: string | null; collection?: string }

/**
 * Поиск по админке: страницы админки и записи коллекций. Права пользователя соблюдаются
 * (overrideAccess: false): маркетолог не найдёт заказы, если у него нет к ним доступа.
 */
export async function searchAdmin(
  payload: Payload,
  user: SearchUser,
  query: string,
): Promise<SearchGroup[]> {
  const groups: SearchGroup[] = []
  const pages = matchPages(query, user.role === 'admin')
  if (pages.length) groups.push({ label: 'Разделы админки', hits: pages })
  const found = await Promise.all(
    SEARCH_COLLECTIONS.map(async (source) => {
      const slug = source.collection as CollectionSlug
      if (!payload.collections[slug]) return null
      const where: Where = { or: source.fields.map((field) => ({ [field]: { like: query } })) }
      try {
        const { docs } = await payload.find({
          collection: slug,
          where,
          limit: SEARCH_LIMIT,
          depth: 0,
          draft: false,
          overrideAccess: false,
          user: { ...user, collection: 'users' },
          pagination: false,
        })
        const hits = docs.map((doc) => {
          const record = doc as unknown as Record<string, unknown>
          const note = source.note ? shortLabel(record[source.note]) : ''
          return {
            label: shortLabel(record[source.title]) || 'Без названия',
            ...(note ? { note } : {}),
            href: `/admin/collections/${source.collection}/${String(record.id)}`,
          }
        })
        return hits.length ? { label: source.label, hits } : null
      } catch {
        // Нет доступа к коллекции — её просто нет в результатах.
        return null
      }
    }),
  )
  for (const group of found) if (group) groups.push(group)
  return groups
}
