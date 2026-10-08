'use client'

import { useState } from 'react'
import { chunk, type Plan, StepError, step } from '@/lib/bitrixImportClient'

/** Столько товаров с картинками уходит в одном запросе. */
const PART = 8

type ImageFailure = { product: string; path: string; reason: string }
type ImageAnswer = {
  images: {
    downloaded: number
    reused: number
    products: number
    failed: ImageFailure[]
    postponed: number
    notInBase: number
    hadGallery: number
  }
}

export type ImagesTotals = {
  downloaded: number
  reused: number
  galleries: number
  notInBase: number
  hadGallery: number
  failed: ImageFailure[]
}

export type ImagesState =
  | { phase: 'idle' }
  | { phase: 'running'; done: number; total: number; totals: ImagesTotals }
  | { phase: 'stopped'; error: string; done: number; total: number; totals: ImagesTotals }
  | { phase: 'done'; total: number; totals: ImagesTotals }

const emptyTotals = (): ImagesTotals => ({
  downloaded: 0,
  reused: 0,
  galleries: 0,
  notInBase: 0,
  hadGallery: 0,
  failed: [],
})

type Item = { legacyKey: string; title: string; images: string[] }

/**
 * Одна часть товаров: шлём её снова, пока сервер не скажет, что отложенных картинок нет.
 * Не скачавшиеся пути запоминаются и больше не запрашиваются.
 */
async function sendPart(part: Item[], failedPaths: Set<string>, totals: ImagesTotals) {
  const paths = new Set(part.flatMap((item) => item.images))
  for (let pass = 0; ; pass++) {
    const skip = [...failedPaths].filter((p) => paths.has(p))
    const { images } = await step<ImageAnswer>({ action: 'images', items: part, skip })
    totals.downloaded += images.downloaded
    totals.galleries += images.products
    if (pass === 0) {
      totals.reused += images.reused
      totals.notInBase += images.notInBase
      totals.hadGallery += images.hadGallery
    }
    for (const failure of images.failed) {
      failedPaths.add(failure.path)
      totals.failed.push(failure)
    }
    if (!images.postponed) return
    if (!images.downloaded && !images.failed.length)
      throw new StepError('Старый сайт не отвечает: картинки не качаются.')
  }
}

/**
 * Докачка картинок со старого cad.kz частями. Каждый запрос качает, сколько успеет, и
 * говорит, сколько отложено; ту же часть шлём снова, пока отложенных не останется.
 * Повторный запуск не качает уже скачанное и пропускает товары с готовой галереей.
 */
export function useBitrixImages(plan: Plan | null) {
  const [state, setState] = useState<ImagesState>({ phase: 'idle' })

  const items: Item[] = (plan?.products ?? [])
    .filter((p) => p.images.length)
    .map((p) => ({ legacyKey: p.legacyKey, title: p.data.title, images: p.images }))

  async function run() {
    const total = items.length
    const totals = emptyTotals()
    const failedPaths = new Set<string>()
    let done = 0
    try {
      for (const part of chunk(items, PART)) {
        setState({ phase: 'running', done, total, totals: { ...totals } })
        await sendPart(part, failedPaths, totals)
        done += part.length
      }
      setState({ phase: 'done', total, totals })
    } catch (error) {
      const text = error instanceof StepError ? error.message : 'Не удалось связаться с сайтом.'
      setState({ phase: 'stopped', error: text, done, total, totals })
    }
  }

  return { state, withImages: items.length, run }
}
