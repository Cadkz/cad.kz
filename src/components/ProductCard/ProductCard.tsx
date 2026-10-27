import { ArrowRight } from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'
import { cardInfo } from '@/domain/cardTexts.mjs'
import type { Lifecycle } from '@/lib/equipmentResearch'
import type { Picture } from '@/lib/pictures'
import { AddToCartButton } from '../AddToCartButton/AddToCartButton'
import { Badge } from '../Badge/Badge'
import { DirectionArt, hasDirectionArt } from '../DirectionArt/DirectionArt'
import { ProductLifecycle } from '../ProductLifecycle/ProductLifecycle'
import { SectionIcon } from '../SectionIcon/SectionIcon'
import styles from './ProductCard.module.css'

export type ProductCardData = {
  logoFallback?: string | null
  /** Раздел услуги: без картинки в карточке — его чертёж (DirectionArt), а не значок. */
  art?: string | null
  lifecycle?: Lifecycle | null
  id: number
  href: string
  title: string
  manufacturer: string | null
  /** Описание товара целиком (поиск, подборки). */
  summary: string | null
  /**
   * Коротко для карточки — одна мысль без обрыва (src/domain/cardTexts.mjs). Нет — первая фраза
   * описания без «Название — ».
   */
  cardText?: string | null
  icon: string | null
  /**
   * У программы — логотип, у оборудования — фото (src/domain/cardLogos.mjs); нет — подложка
   * со значком раздела.
   */
  picture: Picture | null
  /** Цена самой доступной комплектации, рассчитанная сервером, или null — «по запросу». */
  priceFrom: string | null
  offersCount: number
  /** Единственная комплектация с ценой — квадрат с корзиной рядом с «Подробнее». */
  cartOfferId: string | null
  /**
   * Остальные товары и семейства кладутся в корзину запросом (src/domain/cart.mjs, просьба
   * владельца 27.10.2026): комплектацию и цену подберёт менеджер при оформлении.
   */
  requestKey?: string | null
  /** Плитка-ссылка «Популярных решений» без товара: без цены и корзины. */
  linkOnly?: boolean
  badge: string | null
  /**
   * Категория курса (src/domain/courseTopics.mjs): у курсов картинок нет — тёмный лист со
   * значком направления курса (замечание владельца 27.10.2026). Группы «Обучения» в каталоге.
   */
  topic?: string
}

/**
 * Карточка товара в каталоге (пробная ветка redesign/catalog-cards, 27.10.2026, по замечаниям
 * владельца): белая, вся — ссылка, при наведении рамка целиком синяя. Сверху строка: картинка
 * --thumb-size без подложки (логотип или фото — одного размера) и рядом производитель и название;
 * ниже на всю ширину короткое описание (src/domain/cardTexts.mjs), цена и низ — «Подробнее»
 * контуром и, если у товара одна комплектация с ценой, синий квадрат «корзина +».
 * Цена — только серверная.
 */
export function ProductCard({ product }: { product: ProductCardData }) {
  const cartKey = product.linkOnly ? null : (product.cartOfferId ?? product.requestKey ?? null)
  const info = cardInfo({
    title: product.title,
    own: product.cardText,
    summary: product.summary,
    fallback: 'Описание и комплектации — на странице товара',
  })
  const mediaClass = product.picture
    ? styles.media
    : `${styles.media} ${
        product.topic
          ? styles.course
          : product.art && hasDirectionArt(product.art)
            ? styles.blueprint
            : styles.placeholder
      }`
  return (
    <article className={styles.card}>
      <div className={styles.head}>
        <span className={mediaClass} aria-hidden="true">
          {product.picture ? (
            <Image
              src={product.picture.url}
              alt=""
              width={product.picture.width}
              height={product.picture.height}
              sizes="64px"
              unoptimized={product.picture.local}
              className={styles.image}
            />
          ) : product.topic ? (
            <SectionIcon name={product.icon} size={24} />
          ) : product.logoFallback ? (
            <span className={styles.logoFallback}>{product.logoFallback}</span>
          ) : product.art && hasDirectionArt(product.art) ? (
            <DirectionArt slug={product.art} className={styles.art} />
          ) : (
            <SectionIcon name={product.icon} size={24} />
          )}
        </span>
        <div className={styles.name}>
          {product.manufacturer && <p className={styles.vendor}>{product.manufacturer}</p>}
          <h3 className={styles.title}>
            <Link href={product.href} className={styles.titleLink}>
              {info.title}
            </Link>
          </h3>
        </div>
      </div>
      <p className={styles.summary}>{info.text}</p>
      <ProductLifecycle value={product.lifecycle} />
      {product.badge && (
        <div className={styles.badge}>
          <Badge>{product.badge}</Badge>
        </div>
      )}
      <div className={styles.bottom}>
        {!product.linkOnly && (
          <p className={styles.price}>
            {product.priceFrom
              ? `${product.offersCount > 1 ? 'от ' : ''}${product.priceFrom}`
              : 'Цена по запросу'}
          </p>
        )}
        <div className={styles.foot}>
          {/* Та же ссылка, что у названия (карточка целиком): для диктора и клавиатуры — одна. */}
          <span className={styles.more} aria-hidden="true">
            Подробнее
            <ArrowRight size={16} strokeWidth={1.75} />
          </span>
          {cartKey && (
            <span className={styles.cart}>
              <AddToCartButton
                offerId={cartKey}
                title={product.title}
                look="icon"
                request={!product.cartOfferId}
              />
            </span>
          )}
        </div>
      </div>
    </article>
  )
}
