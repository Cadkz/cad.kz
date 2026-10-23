'use client'

import Image from 'next/image'
import { useState } from 'react'
import type { Picture } from '@/lib/pictures'
import type { Fact } from '@/lib/product'
import { ProductModel } from '../ProductModel/ProductModel'
import styles from './ProductStage.module.css'

type Props = {
  title: string
  picture: Picture | null
  /** Адрес 3D-модели (src/domain/productModels.mjs) или null. */
  model: string | null
  facts: Fact[]
}

/**
 * Сцена первого экрана оборудования (пробная ветка, по референсу Longbow): крупное вырезанное
 * фото на светлой подложке и три главных факта рядом. Если есть 3D-модель — кнопка «Покрутить
 * в 3D» поверх фото, а без фото модель стоит сразу на его месте.
 */
export function ProductStage({ title, picture, model, facts }: Props) {
  const [show3d, setShow3d] = useState(false)
  const modelOnly = !picture
  return (
    <div className={styles.stage}>
      <div className={styles.media}>
        {picture && !show3d && (
          <Image
            src={picture.url}
            alt={picture.alt || title}
            width={picture.width}
            height={picture.height}
            sizes="(min-width: 1200px) 560px, (min-width: 960px) 46vw, 100vw"
            // Фото сцены — главная картинка первого экрана: заранее и с высоким приоритетом.
            preload
            fetchPriority="high"
            className={styles.image}
          />
        )}
        {model && (
          <ProductModel src={model} title={title} auto={modelOnly} onOpen={() => setShow3d(true)} />
        )}
      </div>
      {facts.length > 0 && (
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
  )
}
