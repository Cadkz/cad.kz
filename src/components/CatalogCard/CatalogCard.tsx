import { ArrowRight } from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'
import type { CatalogGroup } from '@/lib/catalog'
import type { CardInfo } from '@/lib/catalogShelves'
import { plural } from '@/lib/plural'
import { AddToCartButton } from '../AddToCartButton/AddToCartButton'
import { Badge } from '../Badge/Badge'
import type { ProductCardData } from '../ProductCard/ProductCard'
import { ProductLifecycle } from '../ProductLifecycle/ProductLifecycle'
import { SectionIcon } from '../SectionIcon/SectionIcon'
import styles from './CatalogCard.module.css'

type Props = {
  product: ProductCardData & { group: CatalogGroup }
  info: CardInfo
  /** Вместо цены — у карточки-подборки («3D-сканеры Artec»): «8 позиций». */
  note?: string
}

/** «Входит: Revit, AutoCAD, Civil 3D и ещё 10» или «14 программ: АРБАТ, КРИСТАЛЛ, ВЕСТ…». */
function includesText(info: CardInfo) {
  if (!info.includes) return null
  const { names, total } = info.includes
  const rest = total - names.length
  if (info.kind === 'Линейка')
    return `${total} ${plural(total, 'программа', 'программы', 'программ')}: ${names.join(', ')}${rest > 0 ? '…' : ''}`
  return `Входит: ${names.join(', ')}${rest > 0 ? ` и ещё ${rest}` : ''}`
}

type Product = Props['product']

/** Значок программы, фото оборудования или подпись производителя, если картинки нет. */
function markContent(product: Product, photo: boolean) {
  if (product.picture)
    return (
      <Image
        src={product.picture.url}
        alt=""
        width={product.picture.width}
        height={product.picture.height}
        sizes={photo ? '(min-width: 1200px) 280px, (min-width: 640px) 45vw, 80px' : '48px'}
        unoptimized={product.picture.local}
        className={styles.image}
      />
    )
  if (product.logoFallback) return <span className={styles.fallback}>{product.logoFallback}</span>
  return <SectionIcon name={product.icon} size={20} />
}

/** Строка цены: подпись подборки, «от …» или «Цена по запросу». */
function priceLine(product: Product, note?: string) {
  if (note) return <p className={styles.onRequest}>{note}</p>
  if (!product.priceFrom) return <p className={styles.onRequest}>Цена по запросу</p>
  return (
    <p className={styles.price}>
      {product.offersCount > 1 ? 'от ' : ''}
      {product.priceFrom}
    </p>
  )
}

/**
 * Карточка каталога одного вида для всего (пробная ветка redesign/catalog-v2): что это одним
 * словом («Коллекция», «Линейка», «Модуль», «Плоттер»), производитель, название, зачем — две
 * строки, состав коллекции или линейки, цена и одно действие. У программ и услуг слева вверху
 * значок программы, у оборудования — фото сверху. Описание вернулось в карточку: без него
 * не понять, чем AEC Collection отличается от Revit (замечание владельца 26.10.2026).
 */
export function CatalogCard({ product, info, note }: Props) {
  const photo = Boolean(
    product.group === 'hardware' && product.picture && product.picture.fit !== 'logo',
  )
  const includes = includesText(info)
  return (
    <article className={photo ? `${styles.card} ${styles.withPhoto}` : styles.card}>
      <Link
        href={product.href}
        className={photo ? styles.photo : styles.mark}
        tabIndex={-1}
        aria-hidden="true"
      >
        {markContent(product, photo)}
      </Link>
      <p className={styles.kind}>
        <span className={styles.kindLabel}>{info.kind}</span>
        {product.manufacturer && <span className={styles.vendor}>{product.manufacturer}</span>}
      </p>
      <h3 className={styles.title}>
        <Link href={product.href} className={styles.titleLink}>
          {product.title}
        </Link>
      </h3>
      {product.summary && <p className={styles.summary}>{product.summary}</p>}
      {includes && <p className={styles.includes}>{includes}</p>}
      <ProductLifecycle value={product.lifecycle} />
      {product.badge && (
        <div className={styles.badge}>
          <Badge>{product.badge}</Badge>
        </div>
      )}
      <div className={styles.foot}>
        {priceLine(product, note)}
        {product.cartOfferId ? (
          <AddToCartButton offerId={product.cartOfferId} title={product.title} />
        ) : (
          <Link href={product.href} className={styles.more} tabIndex={-1} aria-hidden="true">
            Подробнее
            <ArrowRight size={16} strokeWidth={1.75} aria-hidden="true" />
          </Link>
        )}
      </div>
    </article>
  )
}
