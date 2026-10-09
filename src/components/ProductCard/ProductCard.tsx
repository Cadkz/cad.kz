import { ArrowRight, SlidersHorizontal } from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'
import type { Picture } from '@/lib/pictures'
import { AddToCartButton } from '../AddToCartButton/AddToCartButton'
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
  /** Единственная комплектация: её можно положить в корзину прямо из карточки. */
  singleOffer: { id: string; configuration: string } | null
  badge: string | null
}

/** Карточка товара в каталоге. Цена — только серверная, из CMS-предложений. */
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
      <div className={styles.actions}>
        <Link href={product.href} className={styles.more}>
          Подробнее
          <ArrowRight size={16} strokeWidth={1.75} aria-hidden="true" />
        </Link>
        {product.singleOffer ? (
          <AddToCartButton
            offerId={product.singleOffer.id}
            productTitle={product.title}
            configuration={product.singleOffer.configuration}
          />
        ) : (
          <Link
            href={`${product.href}#config`}
            className={styles.configure}
            aria-label={`Выбрать комплектацию: ${product.title}`}
          >
            <SlidersHorizontal size={20} strokeWidth={1.75} aria-hidden="true" />
          </Link>
        )}
      </div>
    </article>
  )
}
