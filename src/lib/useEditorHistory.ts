'use client'

import { type RefObject, useCallback, useRef } from 'react'

/** Сколько шагов назад помнит редактор. */
const DEPTH = 100

/**
 * Отмена и повтор в визуальном редакторе: снимки текста после каждого изменения. Своя история,
 * а не браузерная: списки, заголовки и таблицы меняются кодом, и браузерный Ctrl+Z их не видит.
 */
export function useEditorHistory(root: RefObject<HTMLDivElement | null>) {
  const past = useRef<string[]>([])
  const future = useRef<string[]>([])
  const current = useRef<string | null>(null)

  const reset = useCallback(() => {
    past.current = []
    future.current = []
    current.current = root.current?.innerHTML ?? null
  }, [root])

  /** Запомнить текст после изменения. */
  const record = useCallback(() => {
    const html = root.current?.innerHTML
    if (html == null || html === current.current) return
    if (current.current != null) past.current = [...past.current, current.current].slice(-DEPTH)
    current.current = html
    future.current = []
  }, [root])

  const step = useCallback(
    (from: RefObject<string[]>, to: RefObject<string[]>) => {
      const editor = root.current
      const html = from.current.at(-1)
      if (!editor || html == null || current.current == null) return false
      from.current = from.current.slice(0, -1)
      to.current = [...to.current, current.current]
      current.current = html
      editor.innerHTML = html
      // Курсор — в конец текста: точное место после отмены не восстанавливаем.
      const range = document.createRange()
      range.selectNodeContents(editor)
      range.collapse(false)
      const selection = window.getSelection()
      selection?.removeAllRanges()
      selection?.addRange(range)
      return true
    },
    [root],
  )

  const undo = useCallback(() => step(past, future), [step])
  const redo = useCallback(() => step(future, past), [step])
  return { reset, record, undo, redo }
}
