'use client'

import { FileSpreadsheet } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import styles from './FileDrop.module.css'

type Props = {
  accept: string
  /** Имя выбранного файла: показывается в поле, чтобы было видно, что он принят. */
  fileName: string | null
  onFile: (file: File) => void
}

/**
 * Поле для файла в админке: файл можно перетащить из папки прямо на страницу (в любое место)
 * или выбрать кнопкой. Пока файл тянут над окном, поле подсвечено.
 */
export function FileDrop({ accept, fileName, onFile }: Props) {
  const [over, setOver] = useState(false)
  const input = useRef<HTMLInputElement>(null)
  const depth = useRef(0)
  const handler = useRef(onFile)
  handler.current = onFile

  useEffect(() => {
    const hasFiles = (event: DragEvent) => event.dataTransfer?.types.includes('Files') ?? false
    const enter = (event: DragEvent) => {
      if (!hasFiles(event)) return
      depth.current++
      setOver(true)
    }
    const leave = (event: DragEvent) => {
      if (!hasFiles(event)) return
      depth.current = Math.max(0, depth.current - 1)
      if (!depth.current) setOver(false)
    }
    // Без preventDefault браузер открыл бы брошенный файл вместо страницы.
    const overPage = (event: DragEvent) => {
      if (hasFiles(event)) event.preventDefault()
    }
    const drop = (event: DragEvent) => {
      if (!hasFiles(event)) return
      event.preventDefault()
      depth.current = 0
      setOver(false)
      const file = event.dataTransfer?.files[0]
      if (file) handler.current(file)
    }
    window.addEventListener('dragenter', enter)
    window.addEventListener('dragleave', leave)
    window.addEventListener('dragover', overPage)
    window.addEventListener('drop', drop)
    return () => {
      window.removeEventListener('dragenter', enter)
      window.removeEventListener('dragleave', leave)
      window.removeEventListener('dragover', overPage)
      window.removeEventListener('drop', drop)
    }
  }, [])

  return (
    <button
      type="button"
      className={styles.zone}
      data-over={over}
      onClick={() => input.current?.click()}
    >
      <FileSpreadsheet size={24} strokeWidth={1.75} aria-hidden="true" />
      <span className={styles.text}>
        {over ? (
          'Отпустите файл'
        ) : fileName ? (
          <>
            <strong>{fileName}</strong> — перетащите другой или нажмите, чтобы выбрать
          </>
        ) : (
          <>
            <strong>Перетащите файл прайса сюда</strong> или нажмите, чтобы выбрать
          </>
        )}
      </span>
      <input
        ref={input}
        type="file"
        accept={accept}
        hidden
        onChange={(event) => {
          const file = event.target.files?.[0]
          if (file) handler.current(file)
          event.target.value = ''
        }}
      />
    </button>
  )
}
