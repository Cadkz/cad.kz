'use client'

import { toast } from '@payloadcms/ui'
import { type ClipboardEvent, type DragEvent, type RefObject, useCallback } from 'react'
import { escapeHtml, htmlToMarkup, imageHtml, markupToHtml } from '@/domain/bodyHtml.mjs'
import { command, insertBlock, insertHtml } from './editorDom'
import { uploadImage } from './mediaUpload'

/** Картинки, которые пришли в HTML без файла: из буфера (data:) или с диска (file:). */
const LOCAL_IMAGE = /<img\b[^>]*\ssrc\s*=\s*["']?(?:data:|file:)/i

/**
 * Вставка и перетаскивание в визуальный редактор. Текст из Word, Excel, сайтов чистится до
 * разметки сайта (заголовки, списки, ссылки, таблицы остаются; шрифты, цвета, жирный — нет).
 * Картинка-файл (скриншот из буфера, файл с компьютера) загружается в «Медиа» и встаёт в текст.
 */
export function useEditorPaste(root: RefObject<HTMLDivElement | null>, sync: () => void) {
  return useCallback(
    async (event: ClipboardEvent<HTMLDivElement> | DragEvent<HTMLDivElement>) => {
      const data = 'clipboardData' in event ? event.clipboardData : event.dataTransfer
      const editor = root.current
      if (!data || !editor) return
      const files = [...data.files].filter((file) => file.type.startsWith('image/'))
      const html = data.getData('text/html')
      const text = data.getData('text/plain')
      const dropped = event.type === 'drop'
      // Перетаскивание текста внутри редактора — обычное поведение браузера.
      if (dropped && !files.length) return
      // Word и Excel кладут в буфер и HTML, и картинку-снимок: берём HTML.
      if (!files.length && !html && !text) return
      event.preventDefault()
      if ('clientX' in event) {
        const at = document.caretRangeFromPoint?.(event.clientX, event.clientY)
        const selection = window.getSelection()
        if (at && selection) {
          selection.removeAllRanges()
          selection.addRange(at)
        }
      }
      if (files.length && !html) {
        for (const file of files) {
          try {
            const image = await uploadImage(file)
            editor.focus()
            insertBlock(editor, imageHtml(image.url, image.alt))
          } catch (error) {
            toast.error(error instanceof Error ? error.message : 'Картинка не загрузилась.')
          }
        }
      } else if (html) {
        insertHtml(markupToHtml(htmlToMarkup(html)))
        if (LOCAL_IMAGE.test(html))
          toast.info(
            'Картинки из скопированного текста не вставились: загрузите их кнопкой «Картинка».',
          )
      } else if (!/\n/.test(text.trim())) command('insertText', text)
      else
        insertHtml(
          text
            .split(/\r?\n/)
            .map((line) => line.trim())
            .filter(Boolean)
            .map((line) => `<p>${escapeHtml(line)}</p>`)
            .join(''),
        )
      sync()
    },
    [root, sync],
  )
}
