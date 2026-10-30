import type { Payload } from 'payload'
import { SEARCH_RETENTION_DAYS, type SearchEvent } from '@/domain/searchStats.mjs'

/** Раз в сколько записей в среднем удалять запросы старше срока хранения. */
const CLEANUP_EVERY = 200

const options = { overrideAccess: true, depth: 0 } as const

/**
 * Сохраняет действие с поиском. Изредка (в среднем раз в CLEANUP_EVERY записей) удаляет запросы
 * старше SEARCH_RETENTION_DAYS дней: отдельная задача по расписанию не нужна, таблица не растёт.
 */
export async function saveSearchEvent(payload: Payload, event: SearchEvent) {
  await payload.create({ collection: 'search-queries', data: event, ...options })
  if (Math.random() * CLEANUP_EVERY >= 1) return
  const since = new Date(Date.now() - SEARCH_RETENTION_DAYS * 86_400_000).toISOString()
  await payload.delete({
    collection: 'search-queries',
    where: { createdAt: { less_than: since } },
    ...options,
  })
}
