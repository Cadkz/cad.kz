import { ChevronRight } from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'
import type { Picture } from '@/lib/pictures'
import { AddToCartButton } from '../AddToCartButton/AddToCartButton'
import styles from './PickRow.module.css'

export type PickItem = {
  href: string
  title: string
  vendor: string | null
  picture: Picture | null
  priceFrom: string | null
  offersCount: number
  cartOfferId: string | null
  /** Товар запросом в корзину (src/domain/cart.mjs), если одной комплектации с ценой нет. */
  requestKey?: string | null
  /** Подпись вместо цены: у линейки «6 программ». */
  note?: string
}

const initials = (title: string) =>
  title
    .replace(/[«»"()]/g, '')
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((word) => word[0])
    .join('')
    .toUpperCase()

/**
 * Строка подборки на странице товара: миниатюра, название, производитель и цена; справа —
 * «В корзину» значком, если комплектация одна, иначе стрелка на страницу товара.
 */
export function PickRow({ item }: { item: PickItem }) {
  const price = item.note
    ? item.note
    : item.priceFrom
      ? `${item.offersCount > 1 ? 'от ' : ''}${item.priceFrom}`
      : 'Цена по запросу'
  return (
    <div className={styles.row}>
      <span className={styles.thumb} aria-hidden="true">
        {item.picture ? (
          <Image
            src={item.picture.url}
            alt=""
            width={item.picture.width}
            height={item.picture.height}
            sizes="64px"
            className={styles.image}
          />
        ) : (
          initials(item.title)
        )}
      </span>
      <span className={styles.text}>
        <Link href={item.href} className={styles.title}>
          {item.title}
        </Link>
        <span className={styles.meta}>
          {item.vendor && <span>{item.vendor}</span>}
          <span className={styles.price}>{price}</span>
        </span>
      </span>
      {item.cartOfferId || item.requestKey ? (
        <AddToCartButton
          offerId={item.cartOfferId ?? item.requestKey ?? ''}
          title={item.title}
          look="icon"
          request={!item.cartOfferId}
        />
      ) : (
        <span className={styles.arrow} aria-hidden="true">
          <ChevronRight size={20} strokeWidth={1.75} />
        </span>
      )}
    </div>
  )
}
