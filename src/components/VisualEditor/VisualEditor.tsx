'use client'

import { toast, useListDrawer } from '@payloadcms/ui'
import { useEffect, useRef, useState } from 'react'
import { imageHtml, videoHtml } from '@/domain/bodyHtml.mjs'
import {
  closestAtCursor,
  command,
  insertBlock,
  insertHtml,
  prepareEditor,
  restoreSelection,
  saveSelection,
  setBlock,
  toggleList,
} from '@/lib/editorDom'
import { editTable, emptyTable, isTableAction, moveInTable } from '@/lib/editorTable'
import { useEditorPaste } from '@/lib/useEditorPaste'
import { useEditorValue } from '@/lib/useEditorValue'
import { EditorInsertPrompt, type InsertKind } from '../EditorInsertPrompt/EditorInsertPrompt'
import { EditorToolbar, type ToolAction } from '../EditorToolbar/EditorToolbar'
import styles from './VisualEditor.module.css'

type Props = { value: string; onChange: (markup: string) => void; readOnly?: boolean }

const BLOCKS: Partial<Record<ToolAction, 'p' | 'h2' | 'h3' | 'blockquote'>> = {
  p: 'p',
  h2: 'h2',
  h3: 'h3',
  quote: 'blockquote',
}

/**
 * Визуальный редактор поля «Текст»: показывает разметку как оформленный текст, каждое
 * изменение превращает обратно в разметку (`domain/bodyHtml.mjs`, `useEditorValue`).
 */
export function VisualEditor({ value, onChange, readOnly }: Props) {
  const root = useRef<HTMLDivElement>(null)
  const range = useRef<Range | null>(null)
  const [prompt, setPrompt] = useState<InsertKind | null>(null)
  const [inTable, setInTable] = useState(false)
  const [MediaDrawer, , media] = useListDrawer({ collectionSlugs: ['media'], uploads: true })
  const { sync, schedule, undo, redo } = useEditorValue(root, value, onChange)
  const onPaste = useEditorPaste(root, sync)

  useEffect(() => {
    const update = () => root.current && setInTable(Boolean(closestAtCursor(root.current, 'table')))
    document.addEventListener('selectionchange', update)
    return () => document.removeEventListener('selectionchange', update)
  }, [])

  /** Вставка в место, где был курсор до окна выбора или строки ввода. */
  const insertAtSaved = (insert: (editor: HTMLElement) => void) => {
    if (!root.current) return
    restoreSelection(root.current, range.current)
    insert(root.current)
    sync()
  }

  const onAction = (action: ToolAction) => {
    const editor = root.current
    if (!editor) return
    // Набранное до кнопки — отдельный шаг истории.
    sync()
    const block = BLOCKS[action]
    if (action === 'undo' || action === 'redo') {
      if (!(action === 'undo' ? undo() : redo())) return
    } else if (block) setBlock(editor, block)
    else if (action === 'ul' || action === 'ol') toggleList(editor, action === 'ol')
    else if (action === 'unlink') command('unlink')
    else if (action === 'table') insertBlock(editor, emptyTable())
    else if (action === 'link' || action === 'video' || action === 'image') {
      range.current = saveSelection(editor)
      if (action === 'image') media.openDrawer()
      else setPrompt(action)
      return
    } else if (!isTableAction(action) || !editTable(editor, action)) return
    sync()
  }

  const onInsert = (url: string) => {
    const kind = prompt
    setPrompt(null)
    insertAtSaved((editor) => {
      if (kind === 'video') insertBlock(editor, videoHtml(url))
      else if (range.current && !range.current.collapsed) command('createLink', url)
      else insertHtml(`<a href="${encodeURI(url)}">${url.replace(/</g, '&lt;')}</a>&nbsp;`)
    })
  }

  return (
    <div className={styles.root}>
      {!readOnly && <EditorToolbar onAction={onAction} inTable={inTable} />}
      {prompt && (
        <EditorInsertPrompt kind={prompt} onSubmit={onInsert} onCancel={() => setPrompt(null)} />
      )}
      {/* biome-ignore lint/a11y/useSemanticElements: редактор текста — contentEditable, textbox тут уместен */}
      <div
        ref={root}
        className={styles.editor}
        contentEditable={!readOnly}
        suppressContentEditableWarning
        role="textbox"
        aria-multiline="true"
        aria-label="Текст публикации"
        tabIndex={0}
        onFocus={() => root.current && prepareEditor(root.current)}
        onInput={schedule}
        onBlur={sync}
        onPaste={onPaste}
        onDrop={onPaste}
        onKeyDown={(event) => {
          if (event.key === 'Tab' && root.current && moveInTable(root.current, event.shiftKey)) {
            event.preventDefault()
            sync()
            return
          }
          if (!(event.ctrlKey || event.metaKey)) return
          const key = event.key.toLowerCase()
          const redoKey = key === 'y' || (key === 'z' && event.shiftKey)
          if (key !== 'z' && !redoKey) return
          event.preventDefault()
          onAction(redoKey ? 'redo' : 'undo')
        }}
      />
      <MediaDrawer
        allowCreate
        onSelect={({ doc }) => {
          media.closeDrawer()
          const url = typeof doc.url === 'string' ? doc.url : null
          if (!url) return void toast.error('У этой записи «Медиа» нет файла.')
          const alt = typeof doc.alt === 'string' ? doc.alt : ''
          insertAtSaved((editor) => insertBlock(editor, imageHtml(url, alt)))
        }}
      />
    </div>
  )
}
