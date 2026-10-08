import { ArrowRight, SlidersHorizontal } from 'lucide-react'
import Link from 'next/link'
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
      <span className={styles.icon}>
        <SectionIcon name={product.icon} size={20} />
      </span>
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
