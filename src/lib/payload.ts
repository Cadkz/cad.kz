import config from '@payload-config'
import { connection } from 'next/server'
import { getPayload } from 'payload'

/**
 * Payload для чтения данных страниц на сервере.
 * connection() делает страницу динамической: правки в админке видны сразу, без пересборки.
 */
export async function cms() {
  await connection()
  return getPayload({ config })
}

/**
 * Payload без connection(): только для загрузчиков в общем кэше сайта (src/lib/siteCache.ts) —
 * внутри кэша connection() запрещён, его вызывает сама обёртка siteCached до кэша.
 */
export function cmsData() {
  return getPayload({ config })
}
