'use client'

import { useEffect, useMemo, useState } from 'react'
import {
  initialState,
  type PickedLine,
  type PickerState,
  type PickerView,
  pickedLines,
  setSwitch,
} from '@/domain/picker.mjs'
import { formatKzt } from './format'

/** Итог: считает сервер. «request» — в выборе есть вариант без цены, итог по запросу. */
export type PickerTotal =
  | { state: 'empty' }
  | { state: 'busy' }
  | { state: 'request' }
  | { state: 'done'; text: string }
  | { state: 'error'; text: string }

/** Выбор в подборе и итог с сервера (/api/quote). Клиент передаёт только ID и количество. */
export function usePicker(view: PickerView, pick: number | null) {
  const [state, setState] = useState<PickerState>(() => initialState(view, pick))
  const [quantity, setQuantityRaw] = useState(1)
  const [total, setTotal] = useState<PickerTotal>({ state: 'empty' })
  const lines: PickedLine[] = useMemo(() => pickedLines(view, state), [view, state])
  // Что считать: пусто, по запросу (есть вариант без цены) или тело запроса к серверу.
  const request = !lines.length
    ? 'empty'
    : lines.some((line) => !line.offer?.price)
      ? 'request'
      : JSON.stringify({
          items: lines.map((line) => ({ offerId: line.offer?.id, quantity })),
        })

  useEffect(() => {
    if (request === 'empty' || request === 'request') return setTotal({ state: request })
    const controller = new AbortController()
    setTotal({ state: 'busy' })
    fetch('/api/quote', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: request,
      signal: controller.signal,
    })
      .then(async (response) => {
        const data = await response.json()
        if (!response.ok) throw new Error(data.error || 'Не удалось рассчитать цену')
        setTotal({ state: 'done', text: formatKzt(data.totalKzt) })
      })
      .catch((error: unknown) => {
        if (controller.signal.aborted) return
        setTotal({ state: 'error', text: error instanceof Error ? error.message : 'Ошибка сети' })
      })
    return () => controller.abort()
  }, [request])

  return {
    state,
    lines,
    quantity,
    total,
    setQuantity: (value: number) => setQuantityRaw(Math.min(999, Math.max(1, value || 1))),
    chooseSwitch: (key: string, value: string) => setState((s) => setSwitch(view, s, key, value)),
    chooseOne: (step: string, item: string) =>
      setState((s) => ({ ...s, one: { ...s.one, [step]: item }, bundle: null })),
    toggle: (item: string) =>
      setState((s) => ({
        ...s,
        bundle: null,
        many: s.many.includes(item) ? s.many.filter((k) => k !== item) : [...s.many, item],
      })),
    chooseBundle: (item: string | null) =>
      setState((s) => ({ ...s, bundle: s.bundle === item ? null : item })),
  }
}

export type PickerApi = ReturnType<typeof usePicker>
