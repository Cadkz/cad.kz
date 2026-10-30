import type { CollectionConfig, GlobalConfig } from 'payload'
import { refreshSiteData } from '../../lib/siteCache'

/**
 * Сброс кэша данных сайта (src/lib/siteCache.ts) после правки в админке: товары, цены, разделы,
 * курсы валют, страницы, настройки. Служебные коллекции, куда сайт пишет сам на каждый запрос
 * (поиск, разговоры Кадди, журнал, заявки), кэш не трогают — иначе он сбрасывался бы постоянно.
 */
const KEEP = new Set([
  'search-queries',
  'conversations',
  'activity-log',
  'site-requests',
  'orders',
  'crm-deliveries',
  'import-runs',
  'integrations',
  'users',
  'assistant-knowledge',
  'price-tables',
  'payload-query-presets',
])

const after = () => {
  refreshSiteData()
}

export function withSiteCache(collection: CollectionConfig): CollectionConfig {
  if (KEEP.has(collection.slug)) return collection
  const hooks = collection.hooks ?? {}
  return {
    ...collection,
    hooks: {
      ...hooks,
      afterChange: [...(hooks.afterChange ?? []), after],
      afterDelete: [...(hooks.afterDelete ?? []), after],
    },
  }
}

export function withSiteCacheGlobal(global: GlobalConfig): GlobalConfig {
  const hooks = global.hooks ?? {}
  return { ...global, hooks: { ...hooks, afterChange: [...(hooks.afterChange ?? []), after] } }
}
