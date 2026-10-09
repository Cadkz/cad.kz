'use client'

import Image from 'next/image'
import { useState } from 'react'
import type { Picture } from '@/lib/pictures'
import styles from './ProductGallery.module.css'

type Props = { pictures: Picture[]; title: string }

/**
 * Картинки на странице товара: главная на 8 колонок, под ней миниатюры, если картинок несколько.
 * Переключение без перезагрузки; первая картинка — первая на экране, грузится с приоритетом.
 */
export function ProductGallery({ pictures, title }: Props) {
  const [active, setActive] = useState(0)
  const current = pictures[active] ?? pictures[0]
  if (!current) return null
  return (
    <div className={styles.gallery}>
      <div className={styles.main}>
        <Image
          src={current.url}
          alt={current.alt || title}
          width={current.width}
          height={current.height}
          sizes="(min-width: 1200px) 784px, (min-width: 960px) 66vw, 100vw"
          priority={active === 0}
          className={styles.image}
        />
      </div>
      {pictures.length > 1 && (
        <ul className={styles.thumbs} aria-label="Картинки товара">
          {pictures.map((picture, index) => (
            <li key={picture.url}>
              <button
                type="button"
                className={index === active ? `${styles.thumb} ${styles.active}` : styles.thumb}
                aria-label={`Картинка ${index + 1} из ${pictures.length}`}
                aria-pressed={index === active}
                onClick={() => setActive(index)}
              >
                <Image
                  src={picture.url}
                  alt=""
                  width={picture.width}
                  height={picture.height}
                  sizes="64px"
                  className={styles.image}
                />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
