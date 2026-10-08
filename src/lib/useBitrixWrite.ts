'use client'

import { useRef, useState } from 'react'
import { chunk, type Plan, StepError, step } from '@/lib/bitrixImportClient'
import type { RunSnapshot } from '@/lib/bitrixImportRun'

/** Размер части: столько записей сервер успевает записать за один запрос. */
const PART = { products: 40, offers: 120 }

type Stage = 'products' | 'offers' | 'finish'
type Cursor = { runId: number | string; stage: Stage; part: number }
type RunAnswer = {
  runId: number | string
  processed?: number
  missing?: string[]
  snapshot: RunSnapshot
}

export type WriteState =
  | { phase: 'idle' }
  | { phase: 'writing'; label: string; done: number; total: number }
  | { phase: 'stopped'; error: string; done: number; total: number }
  | { phase: 'written'; snapshot: RunSnapshot }

const message = (error: unknown) =>
  error instanceof StepError ? error.message : 'Не удалось связаться с сайтом.'

const LABELS = { products: 'Товары', offers: 'Варианты с ценой' } as const
const NEXT = { products: 'offers', offers: 'finish' } as const

/** Шлёт часть, пока сервер не запишет её целиком: за один запрос он пишет, сколько успеет. */
async function sendPart<T>(
  stage: 'products' | 'offers',
  runId: number | string,
  part: T[],
  onWritten: (count: number) => void,
) {
  let rest = part
  while (rest.length) {
    const answer = await step<RunAnswer>({ action: stage, runId, items: rest })
    const processed = answer.processed ?? 0
    if (!processed) throw new StepError('Сервер не успел записать ни одной записи.')
    rest = rest.slice(processed)
    onWritten(processed)
  }
}

/**
 * Конец запуска. Сервер сверяет план с базой и возвращает, чего в ней нет; это дописываем
 * и спрашиваем снова. Если и после двух дописок чего-то нет — запись не сохраняется.
 */
async function finishRun(plan: Plan, runId: number | string, show: (label: string) => void) {
  const keys = [...plan.products, ...plan.offers].map((item) => item.legacyKey)
  for (let round = 0; ; round++) {
    show('Сверяем базу с выгрузкой и снимаем с публикации то, чего в выгрузке больше нет')
    const answer = await step<RunAnswer>({ action: 'finish', runId, keys })
    const missing = new Set(answer.missing ?? [])
    if (!missing.size) return answer.snapshot
    const products = plan.products.filter((p) => missing.has(p.legacyKey))
    const offers = plan.offers.filter((o) => missing.has(o.legacyKey))
    if (round >= 2)
      throw new StepError(
        `в базе не нашлось ${products.length} товаров из ${plan.products.length} и ${offers.length} вариантов из ${plan.offers.length}, хотя сайт ответил, что записал их. Перешлите это сообщение разработчику.`,
      )
    show(`Дописываем недостающее: ${missing.size}`)
    for (const part of chunk(products, PART.products))
      await sendPart('products', runId, part, () => {})
    for (const part of chunk(offers, PART.offers)) await sendPart('offers', runId, part, () => {})
  }
}

/** Запись плана в базу частями. После ошибки можно продолжить с того же места. */
export function useBitrixWrite(plan: Plan | null) {
  const [state, setState] = useState<WriteState>({ phase: 'idle' })
  const cursor = useRef<Cursor | null>(null)

  async function begin(current: Plan, hideDemo: boolean): Promise<Cursor> {
    const started = await step<RunAnswer>({
      action: 'start',
      hideDemo,
      manufacturers: current.manufacturers,
      planned: { products: current.products.length, offers: current.offers.length },
    })
    return { runId: started.runId, stage: 'products', part: 0 }
  }

  async function run(hideDemo: boolean, resume: boolean) {
    if (!plan) return
    const parts: Record<'products' | 'offers', object[][]> = {
      products: chunk(plan.products, PART.products),
      offers: chunk(plan.offers, PART.offers),
    }
    const total = plan.products.length + plan.offers.length
    let done = 0
    const show = (label: string) => setState({ phase: 'writing', label, done, total })
    try {
      show('Подготовка: производители, курсы, демотовары')
      if (!resume || !cursor.current) {
        // Новый запуск: старый курсор не должен ожить, если начало не удалось.
        cursor.current = null
        cursor.current = await begin(plan, hideDemo)
      }
      const at = cursor.current
      for (const stage of ['products', 'offers'] as const) {
        // Курсор идёт только вперёд: другой этап в нём — значит, этот уже записан.
        if (at.stage !== stage) {
          done += plan[stage].length
          continue
        }
        done += parts[stage].slice(0, at.part).flat().length
        for (; at.part < parts[stage].length; at.part++) {
          show(LABELS[stage])
          await sendPart(stage, at.runId, parts[stage][at.part], (count) => {
            done += count
            show(LABELS[stage])
          })
        }
        at.stage = NEXT[stage]
        at.part = 0
      }
      const snapshot = await finishRun(plan, at.runId, show)
      cursor.current = null
      setState({ phase: 'written', snapshot })
    } catch (error) {
      setState({ phase: 'stopped', error: message(error), done, total })
    }
  }

  return {
    state,
    start: (hideDemo: boolean) => run(hideDemo, false),
    resume: (hideDemo: boolean) => run(hideDemo, true),
    reset: () => {
      cursor.current = null
      setState({ phase: 'idle' })
    },
  }
}
