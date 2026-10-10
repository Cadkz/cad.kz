'use client'

import { useEffect, useRef, useState } from 'react'
import { MIN_QUERY, type SuggestResult } from '@/domain/suggest.mjs'

export type SuggestState =
  | { status: 'idle' }
  | { status: 'loading'; result: SuggestResult | null }
  | { status: 'done'; result: SuggestResult }
  | { status: 'error' }

const DELAY = 150

/**
 * Подсказки по ходу набора: запрос к /api/search через 150 мс после последней буквы, прежний
 * запрос отменяется, ответы запоминаются — стёртая и снова набранная буква не идёт на сервер.
 * Пока ждём ответ, видны прошлые подсказки: список не мигает.
 */
export function useSuggest(query: string): SuggestState {
  const [state, setState] = useState<SuggestState>({ status: 'idle' })
  const cache = useRef(new Map<string, SuggestResult>())
  const trimmed = query.trim()

  useEffect(() => {
    if (trimmed.length < MIN_QUERY) {
      setState({ status: 'idle' })
      return
    }
    const key = trimmed.toLowerCase()
    const known = cache.current.get(key)
    if (known) {
      setState({ status: 'done', result: known })
      return
    }
    setState((prev) => ({
      status: 'loading',
      result: prev.status === 'done' || prev.status === 'loading' ? prev.result : null,
    }))
    const controller = new AbortController()
    const timer = setTimeout(async () => {
      try {
        const response = await fetch(`/api/search?q=${encodeURIComponent(trimmed)}`, {
          signal: controller.signal,
        })
        if (!response.ok) throw new Error(String(response.status))
        const result: SuggestResult = await response.json()
        cache.current.set(key, result)
        setState({ status: 'done', result })
      } catch {
        // Отменённый запрос — не ошибка: его заменил более свежий.
        if (!controller.signal.aborted) setState({ status: 'error' })
      }
    }, DELAY)
    return () => {
      clearTimeout(timer)
      controller.abort()
    }
  }, [trimmed])

  return state
}
