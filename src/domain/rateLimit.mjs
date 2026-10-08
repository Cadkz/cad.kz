// Ограничение частоты запросов в памяти процесса: не более limit запросов за windowMs на ключ.
// На хостинге с несколькими копиями сервера у каждой копии свой счётчик, поэтому это только первый
// заслон. Общий для всех копий лимит по телефону и адресу считается по базе (см. checkout.mjs).

/**
 * @param {{ limit: number, windowMs: number, maxKeys?: number }} options
 */
export function createRateLimiter({ limit, windowMs, maxKeys = 5000 }) {
  /** @type {Map<string, number[]>} */
  const hits = new Map()
  return {
    /** @returns {{ allowed: boolean, retryAfterMs: number }} */
    check(key, now = Date.now()) {
      const recent = (hits.get(key) ?? []).filter((time) => now - time < windowMs)
      if (recent.length >= limit) {
        hits.set(key, recent)
        return { allowed: false, retryAfterMs: Math.max(1, recent[0] + windowMs - now) }
      }
      recent.push(now)
      hits.delete(key)
      hits.set(key, recent)
      // Память ограничена: при переполнении забываем самые давние ключи.
      while (hits.size > maxKeys) {
        const oldest = hits.keys().next()
        if (oldest.done) break
        hits.delete(oldest.value)
      }
      return { allowed: true, retryAfterMs: 0 }
    },
  }
}
