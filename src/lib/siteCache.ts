import { revalidateTag, unstable_cache } from 'next/cache'
import { connection } from 'next/server'

/**
 * Общий кэш данных сайта между запросами (замечание владельца 30.10.2026: каталог грузится
 * с ожиданием). Каталог, меню, контакты и «Популярные решения» читаются из базы один раз и
 * хранятся в кэше Next.js (на Vercel — общий для всех копий сайта). Любая правка в админке
 * (src/cms/hooks/siteCache.ts) сбрасывает кэш, и следующий посетитель видит новое сразу.
 * Раз в час кэш обновляется и без правок — на случай записи в базу в обход админки (скрипты).
 */
export const SITE_TAG = 'site-data'
const HOUR = 3600

/**
 * Загрузчик в общем кэше. connection() — до кэша: страница остаётся динамической (правки видны
 * сразу, без пересборки), а внутри кэша Payload берётся через cmsData().
 */
export function siteCached<T>(key: string, load: () => Promise<T>): () => Promise<T> {
  const cached = unstable_cache(load, [key], { tags: [SITE_TAG], revalidate: HOUR })
  return async () => {
    await connection()
    return cached()
  }
}

/**
 * Сбросить кэш: следующий запрос прочитает базу заново (expire: 0 — старое не показывается).
 * Вне запроса Next.js (скрипты payload run, сборка) сбрасывать нечего — молча пропускаем.
 */
export function refreshSiteData() {
  try {
    revalidateTag(SITE_TAG, { expire: 0 })
  } catch {
    // Не в запросе Next.js.
  }
}
