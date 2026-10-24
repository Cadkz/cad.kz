import Image from 'next/image'
import type { Picture } from '@/lib/pictures'
import type { Fact } from '@/lib/product'
import styles from './ProductStage.module.css'

type Props = {
  title: string
  picture: Picture
  facts: Fact[]
}

/**
 * Сцена первого экрана оборудования (по референсу Longbow): крупное вырезанное фото на светлой
 * подложке с сеткой и три главных факта рядом. Фото статичное (решение владельца 24.10.2026:
 * 3D-модель вместо фото убрана), при прокрутке оно отстаёт от сетки — глубина без JavaScript.
 */
export function ProductStage({ title, picture, facts }: Props) {
  return (
    <div className={styles.stage}>
      <div className={styles.media}>
        <div className={styles.float}>
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
        </div>
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
