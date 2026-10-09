import { ArrowRight } from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'
import type { Picture } from '@/lib/pictures'
import { Badge } from '../Badge/Badge'
import { SectionIcon } from '../SectionIcon/SectionIcon'
import styles from './ProductCard.module.css'

export type ProductCardData = {
  id: number
  href: string
  title: string
  manufacturer: string | null
  summary: string | null
  icon: string | null
  /** Своя картинка товара или картинка производителя; нет — подложка со значком раздела. */
  picture: Picture | null
  /** Цена самой доступной комплектации, рассчитанная сервером, или null — «по запросу». */
  priceFrom: string | null
  offersCount: number
  badge: string | null
}

/**
 * Карточка товара в каталоге: одна кнопка «Подробнее» — на странице товара выбор комплекта
 * и заявка. Цена — только серверная, из CMS-предложений.
 */
export function ProductCard({ product }: { product: ProductCardData }) {
  return (
    <article className={styles.card}>
      <Link
        href={product.href}
        className={product.picture ? styles.media : `${styles.media} ${styles.placeholder}`}
        tabIndex={-1}
        aria-hidden="true"
      >
        {product.picture ? (
          <Image
            src={product.picture.url}
            alt=""
            width={product.picture.width}
            height={product.picture.height}
            sizes="(min-width: 1200px) 300px, (min-width: 960px) 25vw, (min-width: 640px) 50vw, 100vw"
            className={styles.image}
          />
        ) : (
          <SectionIcon name={product.icon} size={24} />
        )}
      </Link>
      <h3 className={styles.title}>
        <Link href={product.href} className={styles.titleLink}>
          {product.title}
        </Link>
      </h3>
      {product.manufacturer && <p className={styles.vendor}>{product.manufacturer}</p>}
      <p className={styles.price}>
        {product.priceFrom
          ? `${product.offersCount > 1 ? 'от ' : ''}${product.priceFrom}`
          : 'Цена по запросу'}
      </p>
      {product.badge && (
        <div className={styles.badge}>
          <Badge>{product.badge}</Badge>
        </div>
      )}
      {product.summary && <p className={styles.summary}>{product.summary}</p>}
      {/* Та же ссылка, что у названия: для клавиатуры и экранного диктора достаточно одной. */}
      <div className={styles.foot}>
        <Link href={product.href} className={styles.more} tabIndex={-1} aria-hidden="true">
          Подробнее
          <ArrowRight size={16} strokeWidth={1.75} aria-hidden="true" />
        </Link>
      </div>
    </article>
  )
}
