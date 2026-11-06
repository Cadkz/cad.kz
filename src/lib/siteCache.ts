import { revalidateTag, unstable_cache } from 'next/cache'
import { connection } from 'next/server'
import type { Lang } from '@/i18n/locales.mjs'
import { requestLang } from '@/i18n/server'

/**
 * Общий кэш данных сайта между запросами (замечание владельца 30.10.2026: каталог грузится
 * с ожиданием). Каталог, меню, контакты и «Популярные решения» читаются из базы один раз и
 * хранятся в кэше Next.js (на Vercel — общий для всех копий сайта). Любая правка в админке
 * (src/cms/hooks/siteCache.ts) сбрасывает кэш, и следующий посетитель видит новое сразу.
 * Раз в час кэш обновляется и без правок — на случай записи в базу в обход админки (скрипты).
 */
export const SITE_TAG = 'site-data'
const HOUR = 3600
const BUILD = process.env.VERCEL_GIT_COMMIT_SHA ?? 'local'

/**
 * Загрузчик в общем кэше. connection() — до кэша: страница остаётся динамической (правки видны
 * сразу, без пересборки), а внутри кэша Payload берётся через cmsData().
 */
export function siteCached<T>(key: string, load: () => Promise<T>): () => Promise<T> {
  // Версия сборки в ключе: кэш Vercel переживает выкладку, а логотипы и правила из кода
  // (src/domain) меняются только с ней — без версии новые логотипы ждали бы до часа (03.11.2026).
  const cached = unstable_cache(load, [key, BUILD], { tags: [SITE_TAG], revalidate: HOUR })
  return async () => {
    await connection()
    return cached()
  }
}

/**
 * То же для данных с переводами (главная, меню, контакты): свой кэш на каждый язык, загрузчик
 * получает язык и читает Payload с locale (пустой перевод Payload заменяет русским).
 */
export function siteCachedByLang<T>(
  key: string,
  load: (lang: Lang) => Promise<T>,
): () => Promise<T> {
  const byLang = new Map<Lang, () => Promise<T>>()
  return async () => {
    const lang = await requestLang()
    let cached = byLang.get(lang)
    if (!cached) {
      cached = siteCached(`${key}:${lang}`, () => load(lang))
      byLang.set(lang, cached)
    }
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
