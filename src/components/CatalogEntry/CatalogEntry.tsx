import Image from 'next/image'
import Link from 'next/link'
import type { ProductCardData } from '../ProductCard/ProductCard'
import { SectionIcon } from '../SectionIcon/SectionIcon'
import styles from './CatalogEntry.module.css'

/** Одна карточка для каталога, популярных товаров и обоих меню. Цены готовит сервер. */
export function CatalogEntry({
  product,
  onNavigate,
}: {
  product: ProductCardData
  onNavigate?: () => void
}) {
  return (
    <Link href={product.href} className={styles.card} onClick={onNavigate}>
      <span className={styles.media}>
        {product.picture ? (
          <Image
            src={product.picture.url}
            alt=""
            width={product.picture.width}
            height={product.picture.height}
            sizes="80px"
            unoptimized={product.picture.local}
            className={styles.image}
          />
        ) : (
          <SectionIcon name={product.icon} size={24} />
        )}
      </span>
      <span className={styles.body}>
        <span className={styles.kind}>
          {product.entryType ?? 'Программа'}
          {product.manufacturer ? ` · ${product.manufacturer}` : ''}
        </span>
        <span className={styles.title}>{product.title}</span>
        {product.summary && <span className={styles.summary}>{product.summary}</span>}
        {product.collectionNote && (
          <span className={styles.collection}>{product.collectionNote}</span>
        )}
        <span className={styles.price}>
          {product.priceFrom
            ? `${product.offersCount > 1 ? 'от ' : ''}${product.priceFrom}`
            : product.entryType === 'Линейка'
              ? 'Смотреть варианты →'
              : 'Цена по запросу'}
        </span>
      </span>
    </Link>
  )
}
