'use client'

// Клиентский: карточка стоит и в фильтре каталога, и на серверных страницах, подписи — по языку страницы.
import { ArrowRight, CalendarDays } from 'lucide-react'
import Image from 'next/image'
import Link from '@/components/LangLink/LangLink'
import { useT } from '@/components/LangProvider/LangProvider'
import { showVendorLine } from '@/domain/cardNoise.mjs'
import { cardInfo } from '@/domain/cardTexts.mjs'
import { NAV_FORWARD } from '@/domain/motion.mjs'
import { sectionIconKey } from '@/domain/sectionArt.mjs'
import type { Lifecycle } from '@/lib/equipmentResearch'
import type { Picture } from '@/lib/pictures'
import { AddToCartButton } from '../AddToCartButton/AddToCartButton'
import { Badge } from '../Badge/Badge'
import { ProductLifecycle } from '../ProductLifecycle/ProductLifecycle'
import { SectionIcon } from '../SectionIcon/SectionIcon'
import styles from './ProductCard.module.css'

export type ProductCardData = {
  logoFallback?: string | null
  /** Раздел услуги: без картинки в карточке — иллюстрация этого раздела. */
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
  /** Ближайший старт курса по расписанию УЦ: «Старт 1 декабря». */
  start?: string | null
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
  const t = useT()
  const cartKey = product.linkOnly ? null : (product.cartOfferId ?? product.requestKey ?? null)
  const info = cardInfo({
    title: product.title,
    own: product.cardText,
    summary: product.summary,
    fallback: t('Описание и комплектации — на странице товара'),
  })
  const textLogo = !product.picture && !product.topic && product.logoFallback
  const mediaClass = product.picture
    ? styles.media
    : `${styles.media} ${textLogo ? styles.placeholder : styles.artBox}`
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
              className={
                product.picture.fit === 'photo' ? `${styles.image} ${styles.photo}` : styles.image
              }
            />
          ) : textLogo ? (
            <span className={styles.logoFallback}>{product.logoFallback}</span>
          ) : (
            <SectionIcon name={sectionIconKey(product.art, product.icon)} size={64} />
          )}
        </span>
        <div className={styles.name}>
          {showVendorLine(product.manufacturer, info.title) && (
            <p className={styles.vendor}>{product.manufacturer}</p>
          )}
          <h3 className={styles.title}>
            <Link
              href={product.href}
              className={styles.titleLink}
              title={info.title}
              transitionTypes={NAV_FORWARD}
            >
              {info.title}
            </Link>
          </h3>
        </div>
      </div>
      <p className={styles.summary}>{info.text}</p>
      {product.start && (
        <p className={styles.start}>
          <CalendarDays size={16} strokeWidth={1.75} aria-hidden="true" />
          {product.start}
        </p>
      )}
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
              ? product.offersCount > 1
                ? t('от {sum}', { sum: product.priceFrom })
                : product.priceFrom
              : t('Цена по запросу')}
          </p>
        )}
        <div className={styles.foot}>
          {/* Та же ссылка, что у названия (карточка целиком): для диктора и клавиатуры — одна. */}
          <span className={styles.more} aria-hidden="true">
            {t('Подробнее')}
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
