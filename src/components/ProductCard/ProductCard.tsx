import { ArrowRight } from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'
import type { Lifecycle } from '@/lib/equipmentResearch'
import type { Picture } from '@/lib/pictures'
import { AddToCartButton } from '../AddToCartButton/AddToCartButton'
import { Badge } from '../Badge/Badge'
import { DirectionArt, hasDirectionArt } from '../DirectionArt/DirectionArt'
import { ProductLifecycle } from '../ProductLifecycle/ProductLifecycle'
import { SectionIcon } from '../SectionIcon/SectionIcon'
import styles from './ProductCard.module.css'

export type ProductCardData = {
  entryType?: string
  collectionNote?: string | null
  logoFallback?: string | null
  /** Раздел услуги: без картинки в карточке — его чертёж (DirectionArt), а не значок. */
  art?: string | null
  lifecycle?: Lifecycle | null
  id: number
  href: string
  title: string
  manufacturer: string | null
  /** Коротко о товаре: в карточке не показывается (карточки одной высоты), остаётся в данных. */
  summary: string | null
  icon: string | null
  /**
   * У программы — логотип, у оборудования — фото (src/domain/cardLogos.mjs); нет — подложка
   * со значком раздела.
   */
  picture: Picture | null
  /** Цена самой доступной комплектации, рассчитанная сервером, или null — «по запросу». */
  priceFrom: string | null
  offersCount: number
  /** Единственная комплектация с ценой — её можно положить в корзину прямо из карточки. */
  cartOfferId: string | null
  badge: string | null
  /**
   * Категория курса (src/domain/courseTopics.mjs): у курсов картинок нет — тёмный лист со
   * значком направления курса (замечание владельца 27.10.2026). Группы «Обучения» в каталоге.
   */
  topic?: string
}

/**
 * Карточка товара в каталоге. Одна кнопка (аудит 21.10.2026, Г4; правило — cardAction в
 * src/domain/buyScenario.mjs): «В корзину», если у стандартной лицензии одна комплектация с ценой,
 * у остальных — «Подробнее». Название и картинка всегда ведут на страницу товара.
 * На телефоне карточка горизонтальная: картинка слева (М3). Описания в карточке нет ни у кого
 * (решение владельца 21.10.2026: карточки ровные), логотипы программ — одного размера по центру
 * рамки, фото оборудования — на всю рамку. Цена — только серверная.
 */
export function ProductCard({ product }: { product: ProductCardData }) {
  return (
    <article className={styles.card}>
      <Link
        href={product.href}
        className={
          product.picture
            ? styles.media
            : `${styles.media} ${
                product.topic
                  ? styles.course
                  : product.art && hasDirectionArt(product.art)
                    ? styles.blueprint
                    : styles.placeholder
              }`
        }
        tabIndex={-1}
        aria-hidden="true"
      >
        {product.picture?.fit === 'logo' ? (
          <Image
            src={product.picture.url}
            alt=""
            width={product.picture.width}
            height={product.picture.height}
            sizes="96px"
            unoptimized={product.picture.local}
            className={`${styles.image} ${styles.logo}`}
          />
        ) : product.picture ? (
          <Image
            src={product.picture.url}
            alt=""
            width={product.picture.width}
            height={product.picture.height}
            sizes="(min-width: 1200px) 300px, (min-width: 960px) 25vw, (min-width: 640px) 50vw, 80px"
            className={styles.image}
          />
        ) : product.topic ? (
          <span className={styles.courseIcon}>
            <SectionIcon name={product.icon} size={24} />
          </span>
        ) : product.logoFallback ? (
          <span className={styles.logoFallback}>{product.logoFallback}</span>
        ) : product.art && hasDirectionArt(product.art) ? (
          <DirectionArt slug={product.art} className={styles.art} />
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
      <ProductLifecycle value={product.lifecycle} />
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
      <div className={styles.foot}>
        {product.cartOfferId ? (
          <AddToCartButton offerId={product.cartOfferId} title={product.title} />
        ) : (
          // Та же ссылка, что у названия: для клавиатуры и экранного диктора достаточно одной.
          <Link href={product.href} className={styles.more} tabIndex={-1} aria-hidden="true">
            Подробнее
            <ArrowRight size={16} strokeWidth={1.75} aria-hidden="true" />
          </Link>
        )}
      </div>
    </article>
  )
}
