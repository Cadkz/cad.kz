'use client'

import { type RefObject, useCallback, useEffect, useRef } from 'react'
import { htmlToMarkup, markupToHtml } from '@/domain/bodyHtml.mjs'
import { prepareEditor } from './editorDom'
import { useEditorHistory } from './useEditorHistory'

/**
 * Связь визуального редактора с полем: текст поля — в редактор, правки — обратно в поле
 * разметкой (набор текста — через 0,3 с, кнопки — сразу). Пока текст не трогали, поле не
 * меняется: старые публикации без правок сохраняются как были.
 */
export function useEditorValue(
  root: RefObject<HTMLDivElement | null>,
  value: string,
  onChange: (markup: string) => void,
) {
  const emitted = useRef<string | null>(null)
  /** Недавно отданные значения: поле может догонять редактор на шаг-два позже. */
  const recent = useRef<string[]>([])
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const history = useEditorHistory(root)
  const { reset, record } = history

  // Текст из базы (и после внешней замены) — в редактор; свои же изменения не перерисовываем.
  useEffect(() => {
    if (root.current && value !== emitted.current && !recent.current.includes(value)) {
      root.current.innerHTML = markupToHtml(value)
      prepareEditor(root.current)
      emitted.current = value
      reset()
    }
    // Только при смене значения поля: на других перерисовках оно может отставать от редактора.
  }, [root, value, reset])

  const sync = useCallback(() => {
    if (timer.current) clearTimeout(timer.current)
    timer.current = null
    if (!root.current) return
    const markup = htmlToMarkup(root.current.innerHTML)
    if (markup === emitted.current) return
    record()
    recent.current = [...recent.current, markup].slice(-20)
    emitted.current = markup
    onChange(markup)
  }, [root, onChange, record])

  const schedule = useCallback(() => {
    if (timer.current) clearTimeout(timer.current)
    timer.current = setTimeout(sync, 300)
  }, [sync])

  return { sync, schedule, undo: history.undo, redo: history.redo }
}
