'use client'

import Image from 'next/image'
import { useState } from 'react'
import type { Picture } from '@/lib/pictures'
import styles from './ProductGallery.module.css'

type Fact = { name: string; value: string }

type Props = {
  pictures: Picture[]
  title: string
  /**
   * Сцена первого экрана (оборудование с фото, пробная ветка 23.10.2026): крупное фото на
   * светлой чертёжной подложке, белый фон снимка растворяется в ней, рядом — главные факты.
   */
  stage?: boolean
  facts?: Fact[]
}

/**
 * Картинки на странице товара: главная на 8 колонок, под ней миниатюры, если картинок несколько.
 * Переключение без перезагрузки; первая картинка — первая на экране, грузится с приоритетом.
 * В виде сцены (stage) фото крупнее и с фактами вокруг, как у Longbow.
 */
export function ProductGallery({ pictures, title, stage = false, facts = [] }: Props) {
  const [active, setActive] = useState(0)
  const current = pictures[active] ?? pictures[0]
  if (!current) return null
  return (
    <div className={stage ? `${styles.gallery} ${styles.isStage}` : styles.gallery}>
      <div className={stage ? `${styles.main} ${styles.stage}` : styles.main}>
        <Image
          src={current.url}
          alt={current.alt || title}
          width={current.width}
          height={current.height}
          sizes={
            stage
              ? '(min-width: 1200px) 560px, (min-width: 960px) 46vw, 100vw'
              : '(min-width: 1200px) 784px, (min-width: 960px) 66vw, 100vw'
          }
          // Первая картинка товара — главная на первом экране: заранее и с высоким приоритетом.
          preload={active === 0}
          fetchPriority={active === 0 ? 'high' : undefined}
          className={styles.image}
        />
        {stage && facts.length > 0 && (
          <dl className={styles.facts}>
            {facts.map((fact) => (
              <div key={fact.name} className={styles.fact}>
                <dt>{fact.name}</dt>
                <dd>{fact.value}</dd>
              </div>
            ))}
          </dl>
        )}
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
