import config from '@payload-config'
import { getPayload } from 'payload'
import { createRateLimiter } from '@/domain/rateLimit.mjs'
import { validateSearchEvent } from '@/domain/searchStats.mjs'
import { clientHash } from '@/lib/checkout'
import { saveSearchEvent } from '@/lib/searchLog'

const MAX_BODY = 1000
const globalStore = globalThis as { __searchLogLimiter?: ReturnType<typeof createRateLimiter> }
globalStore.__searchLogLimiter ??= createRateLimiter({ limit: 30, windowMs: 60_000 })
const limiter = globalStore.__searchLogLimiter

/**
 * Аналитика поиска: POST /api/search/log { query, found, source, click? } → 204.
 * Адрес посетителя нужен только для лимита частоты в памяти и в базу не попадает.
 * Ошибки не показываются человеку: аналитика не должна мешать поиску.
 */
export async function POST(request: Request) {
  const hash = clientHash(request)
  if (hash && !limiter.check(hash).allowed) return new Response(null, { status: 429 })
  const text = await request.text()
  if (text.length > MAX_BODY) return new Response(null, { status: 413 })
  let body: unknown
  try {
    body = JSON.parse(text)
  } catch {
    return new Response(null, { status: 400 })
  }
  const checked = validateSearchEvent(body)
  if (!checked.ok) return new Response(null, { status: 422 })
  try {
    await saveSearchEvent(await getPayload({ config }), checked.value)
  } catch {
    return new Response(null, { status: 503 })
  }
  return new Response(null, { status: 204 })
}
