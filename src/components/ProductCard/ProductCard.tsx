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
  logoFallback?: string | null
  /** Раздел услуги: без картинки в карточке — его чертёж (DirectionArt), а не значок. */
  art?: string | null
  lifecycle?: Lifecycle | null
  id: number
  href: string
  title: string
  manufacturer: string | null
  /** Коротко о товаре: в карточке — назначение тонким шрифтом, до трёх строк. */
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
  /** Единственная комплектация с ценой — квадрат с корзиной рядом с «Подробнее». */
  cartOfferId: string | null
  badge: string | null
  /**
   * Категория курса (src/domain/courseTopics.mjs): у курсов картинок нет — тёмный лист со
   * значком направления курса (замечание владельца 27.10.2026). Группы «Обучения» в каталоге.
   */
  topic?: string
}

/**
 * Описание в карточке — назначение без повтора названия: «AutoCAD — программа для…» →
 * «Программа для…». Обрезается CSS до трёх строк.
 */
function cardSummary(summary: string | null, title: string) {
  if (!summary) return null
  const dash = summary.indexOf(' — ')
  const rest = dash > 0 && dash <= title.length + 24 ? summary.slice(dash + 3) : summary
  return rest.charAt(0).toUpperCase() + rest.slice(1)
}

/**
 * Карточка товара в каталоге (пробная ветка redesign/catalog-cards, 27.10.2026, по карточкам
 * из варианта Codex, которые понравились владельцу): вся карточка — ссылка, при наведении
 * рамка целиком синяя. Слева у программы логотип --card-mark, у оборудования фото --card-thumb;
 * справа производитель, название, назначение тонким шрифтом (до трёх строк), внизу цена.
 * Внизу «Подробнее» на всю ширину и, если у товара одна комплектация с ценой, маленький квадрат
 * с корзиной (решение владельца 27.10.2026). Цена — только серверная.
 */
export function ProductCard({ product }: { product: ProductCardData }) {
  const mark =
    product.picture?.fit === 'logo' || (!product.picture && !product.topic && !product.art)
  const summary = cardSummary(product.summary, product.title)
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
    <article className={mark ? `${styles.card} ${styles.marked}` : styles.card}>
      <span className={mediaClass} aria-hidden="true">
        {product.picture?.fit === 'logo' ? (
          <Image
            src={product.picture.url}
            alt=""
            width={product.picture.width}
            height={product.picture.height}
            sizes="48px"
            unoptimized={product.picture.local}
            className={styles.image}
          />
        ) : product.picture ? (
          <Image
            src={product.picture.url}
            alt=""
            width={product.picture.width}
            height={product.picture.height}
            sizes="80px"
            className={styles.image}
          />
        ) : product.topic ? (
          <span className={styles.courseIcon}>
            <SectionIcon name={product.icon} size={20} />
          </span>
        ) : product.logoFallback ? (
          <span className={styles.logoFallback}>{product.logoFallback}</span>
        ) : product.art && hasDirectionArt(product.art) ? (
          <DirectionArt slug={product.art} className={styles.art} />
        ) : (
          <SectionIcon name={product.icon} size={24} />
        )}
      </span>
      <div className={styles.body}>
        {product.manufacturer && <p className={styles.vendor}>{product.manufacturer}</p>}
        <h3 className={styles.title}>
          <Link href={product.href} className={styles.titleLink}>
            {product.title}
          </Link>
        </h3>
        {summary && <p className={styles.summary}>{summary}</p>}
        <ProductLifecycle value={product.lifecycle} />
        {product.badge && (
          <div className={styles.badge}>
            <Badge>{product.badge}</Badge>
          </div>
        )}
        <p className={styles.price}>
          {product.priceFrom
            ? `${product.offersCount > 1 ? 'от ' : ''}${product.priceFrom}`
            : 'Цена по запросу'}
        </p>
      </div>
      <div className={styles.foot}>
        {/* Та же ссылка, что у названия (карточка целиком): для диктора и клавиатуры — одна. */}
        <span className={styles.more} aria-hidden="true">
          Подробнее
          <ArrowRight size={16} strokeWidth={1.75} />
        </span>
        {product.cartOfferId && (
          <span className={styles.cart}>
            <AddToCartButton offerId={product.cartOfferId} title={product.title} look="icon" />
          </span>
        )}
      </div>
    </article>
  )
}
