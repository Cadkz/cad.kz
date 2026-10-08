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
