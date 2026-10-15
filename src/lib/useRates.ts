'use client'

import { useState } from 'react'
import { todayInAstana } from '@/domain/priceEdit.mjs'
import { adminCall } from './adminCall'
import type { RateCard } from './ratesRun'

/** «Курсы валют»: новые курсы вводятся здесь, сводка и запись — на сервере (src/lib/ratesRun.ts). */

const API = '/api/admin/rates'

export type RateInput = { value: string; day: string }
export type RatePreview = {
  currency: string
  from: string | null
  to: string
  day: string
  now: boolean
  change: { percent: number | null; text: string; big: boolean } | null
  offers: number
  published: number
  examples: { label: string; oldKzt: string | null; newKzt: string | null }[]
}

export function useRates(initial: RateCard[]) {
  const currencies = initial.map((card) => card.currency)
  const [cards, setCards] = useState(initial)
  const today = todayInAstana()
  const [inputs, setInputs] = useState<Record<string, RateInput>>(() =>
    Object.fromEntries(currencies.map((c) => [c, { value: '', day: today }])),
  )
  const [preview, setPreview] = useState<RatePreview[] | null>(null)
  const [confirmBig, setConfirmBig] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [done, setDone] = useState('')

  const items = Object.entries(inputs)
    .filter(([, input]) => input.value.trim())
    .map(([currency, input]) => ({ currency, value: input.value, day: input.day }))
  const big = preview?.some((row) => row.change?.big) ?? false

  async function run<T>(body: Record<string, unknown>, then: (reply: T) => void) {
    setBusy(true)
    setError('')
    try {
      then(await adminCall<T>(API, body))
    } catch (failure) {
      setError(failure instanceof Error ? failure.message : 'Не получилось')
    } finally {
      setBusy(false)
    }
  }

  return {
    cards,
    today,
    inputs,
    set(currency: string, patch: Partial<RateInput>) {
      setInputs((current) => ({ ...current, [currency]: { ...current[currency], ...patch } }))
      setPreview(null)
      setConfirmBig(false)
      setDone('')
    },
    count: items.length,
    preview,
    big,
    confirmBig,
    setConfirmBig,
    busy,
    error,
    done,
    check: () =>
      run<{ rows: RatePreview[] }>({ action: 'preview', items }, (reply) => setPreview(reply.rows)),
    back: () => setPreview(null),
    apply: () =>
      run<{ saved: string[]; cards: RateCard[] }>(
        { action: 'apply', items, confirmBig },
        (reply) => {
          setCards(reply.cards)
          setDone(
            `Записано: ${reply.saved.join(', ')}. Цены на сайте считаются по новому курсу с указанной даты.`,
          )
          setPreview(null)
          setConfirmBig(false)
          setInputs(Object.fromEntries(currencies.map((c) => [c, { value: '', day: today }])))
        },
      ),
  }
}

export type RatesState = ReturnType<typeof useRates>
