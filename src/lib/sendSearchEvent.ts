'use client'

import type { SearchEvent } from '@/domain/searchStats.mjs'

/** Уже отправленные за эту загрузку страницы: одно и то же действие не считается дважды. */
const sent = new Set<string>()

/**
 * Отправляет действие с поиском в аналитику (/api/search/log). sendBeacon доходит и тогда,
 * когда человек уже уходит со страницы; ответ не ждём и ошибки не показываем.
 */
export function sendSearchEvent(event: SearchEvent) {
  const query = event.query.trim()
  if (query.length < 2) return
  const key = `${event.source}|${query.toLowerCase()}|${event.click ?? ''}`
  if (sent.has(key)) return
  sent.add(key)
  const body = JSON.stringify({ ...event, query })
  try {
    // text/plain — без предварительного запроса браузера; сервер читает тело как JSON.
    if (navigator.sendBeacon?.('/api/search/log', new Blob([body], { type: 'text/plain' }))) return
    void fetch('/api/search/log', { method: 'POST', body, keepalive: true }).catch(() => {})
  } catch {
    // Аналитика не должна мешать поиску.
  }
}
