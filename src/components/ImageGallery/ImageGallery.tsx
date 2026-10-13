'use client'

import { ChevronLeft, ChevronRight, X } from 'lucide-react'
import Image from 'next/image'
import { useEffect, useRef, useState } from 'react'
import type { Picture } from '@/lib/pictures'
import styles from './ImageGallery.module.css'

/**
 * Несколько картинок подряд в тексте (сертификаты на странице «О компании»): мелкие превью
 * в ряд, по нажатию — крупно в окне (решение владельца 13.10.2026). Окно — <dialog>:
 * Escape и клик по затемнению закрывают, стрелки листают.
 */
export function ImageGallery({ pictures }: { pictures: Picture[] }) {
  const dialog = useRef<HTMLDialogElement>(null)
  const [index, setIndex] = useState<number | null>(null)
  const current = index === null ? null : pictures[index]

  useEffect(() => {
    const node = dialog.current
    if (!node) return
    if (index !== null && !node.open) node.showModal()
    if (index === null && node.open) node.close()
  }, [index])

  const step = (delta: number) =>
    setIndex((i) => (i === null ? i : (i + delta + pictures.length) % pictures.length))

  return (
    <>
      <ul className={styles.row}>
        {pictures.map((picture, i) => (
          <li key={picture.url}>
            <button
              type="button"
              className={styles.thumb}
              onClick={() => setIndex(i)}
              aria-label={`Открыть крупно: ${picture.alt || `изображение ${i + 1}`}`}
            >
              <Image
                src={picture.url}
                alt={picture.alt}
                width={picture.width}
                height={picture.height}
                sizes="160px"
                className={styles.thumbImage}
              />
            </button>
          </li>
        ))}
      </ul>
      <dialog
        ref={dialog}
        className={styles.dialog}
        aria-label="Просмотр изображения"
        onClose={() => setIndex(null)}
        onClick={(event) => {
          if (event.target === event.currentTarget) setIndex(null)
        }}
        onKeyDown={(event) => {
          if (event.key === 'ArrowRight') step(1)
          if (event.key === 'ArrowLeft') step(-1)
        }}
      >
        {current && (
          <div className={styles.frame}>
            <Image
              src={current.url}
              alt={current.alt}
              width={current.width}
              height={current.height}
              sizes="(min-width: 960px) 900px, 100vw"
              className={styles.full}
            />
            <button
              type="button"
              className={`${styles.control} ${styles.close}`}
              onClick={() => setIndex(null)}
              aria-label="Закрыть"
            >
              <X size={20} strokeWidth={1.75} aria-hidden="true" />
            </button>
            {pictures.length > 1 && (
              <>
                <button
                  type="button"
                  className={`${styles.control} ${styles.prev}`}
                  onClick={() => step(-1)}
                  aria-label="Предыдущее"
                >
                  <ChevronLeft size={20} strokeWidth={1.75} aria-hidden="true" />
                </button>
                <button
                  type="button"
                  className={`${styles.control} ${styles.next}`}
                  onClick={() => step(1)}
                  aria-label="Следующее"
                >
                  <ChevronRight size={20} strokeWidth={1.75} aria-hidden="true" />
                </button>
              </>
            )}
          </div>
        )}
      </dialog>
    </>
  )
}
