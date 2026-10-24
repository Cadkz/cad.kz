'use client'

import { ChevronLeft, ChevronRight, X } from 'lucide-react'
import Image from 'next/image'
import { useCallback, useEffect, useRef } from 'react'
import type { Picture } from '@/lib/pictures'
import styles from './PictureViewer.module.css'

type Props = {
  title: string
  pictures: Picture[]
  index: number | null
  onChange: (index: number | null) => void
}

/** Метка своей записи в истории браузера: «назад» закрывает окно, а не уводит со страницы. */
const MARK = 'cadPictureViewer'

/**
 * Картинка товара крупно (24.10.2026, просьба владельца): светлый лист с разметкой, как сцена,
 * стрелки и клавиши ← → листают. Закрывается крестиком, Esc, нажатием мимо и кнопкой «Назад»
 * (как окно сканов, ScanViewer).
 */
export function PictureViewer({ title, pictures, index, onChange }: Props) {
  const dialog = useRef<HTMLDialogElement>(null)
  const picture = index === null ? null : pictures[index]

  const close = useCallback(() => {
    if (window.history.state?.[MARK]) window.history.back()
    else onChange(null)
  }, [onChange])

  useEffect(() => {
    const node = dialog.current
    if (!node) return
    if (index !== null && !node.open) {
      node.showModal()
      // Состояние роутера Next.js сохраняем, иначе «назад» перезагрузит страницу.
      window.history.pushState({ ...window.history.state, [MARK]: true }, '')
    }
    if (index === null && node.open) node.close()
  }, [index])

  useEffect(() => {
    const onPop = () => {
      if (dialog.current?.open) onChange(null)
    }
    window.addEventListener('popstate', onPop)
    return () => window.removeEventListener('popstate', onPop)
  }, [onChange])

  const step = (delta: number) =>
    onChange(index === null ? null : (index + delta + pictures.length) % pictures.length)

  return (
    <dialog
      ref={dialog}
      className={styles.dialog}
      aria-label={`Картинки: ${title}`}
      onCancel={(event) => {
        event.preventDefault()
        close()
      }}
      onClick={(event) => {
        if (event.target === event.currentTarget) close()
      }}
      onKeyDown={(event) => {
        if (event.key === 'ArrowRight') step(1)
        if (event.key === 'ArrowLeft') step(-1)
      }}
    >
      {picture && (
        <div className={styles.frame}>
          <Image
            key={picture.url}
            src={picture.url}
            alt={picture.alt || title}
            width={picture.width}
            height={picture.height}
            sizes="(min-width: 1200px) 1200px, 100vw"
            className={styles.image}
          />
          <div className={styles.top}>
            <p className={styles.title}>
              {title}
              {pictures.length > 1 && (
                <span className={styles.counter}>
                  {(index ?? 0) + 1} из {pictures.length}
                </span>
              )}
            </p>
            <button type="button" className={styles.control} onClick={close} aria-label="Закрыть">
              <X size={20} strokeWidth={1.75} aria-hidden="true" />
            </button>
          </div>
          {pictures.length > 1 && (
            <>
              <button
                type="button"
                className={`${styles.control} ${styles.prev}`}
                onClick={() => step(-1)}
                aria-label="Предыдущая картинка"
              >
                <ChevronLeft size={20} strokeWidth={1.75} aria-hidden="true" />
              </button>
              <button
                type="button"
                className={`${styles.control} ${styles.next}`}
                onClick={() => step(1)}
                aria-label="Следующая картинка"
              >
                <ChevronRight size={20} strokeWidth={1.75} aria-hidden="true" />
              </button>
            </>
          )}
        </div>
      )}
    </dialog>
  )
}
