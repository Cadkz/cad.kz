import { ArrowRight } from 'lucide-react'
import Link from 'next/link'
import type { ReactNode } from 'react'
import styles from './CatalogTile.module.css'

export type CatalogTileProps = {
  /** Картинка сверху: чертёж направления, фото типа или логотип производителя. */
  media: ReactNode
  /** Логотип производителя — с полями, чертёж — во всю рамку. */
  mediaFit?: 'fill' | 'logo'
  /** Надпись над названием: «Направление», «Тип оборудования», «Производитель». */
  overline: string
  title: string
  /** Одна законченная фраза: что внутри или для чего. Целиком, без обрезки. */
  text: string
  /** Итог, как цена у товара: «28 позиций». */
  meta: string
  href?: string | null
  onPick?: () => void
}

/**
 * Плитка-папка каталога: направление, тип оборудования, производитель (просьба владельца
 * 27.10.2026 — единая система). Те же части и порядок, что у карточки товара (ProductCard):
 * надпись, название, фраза, итог жирным, внизу контурная кнопка «Смотреть». Отличие одно:
 * у папки картинка сверху, у товара значок слева. Белая, при наведении синяя рамка.
 */
export function CatalogTile({
  media,
  mediaFit = 'fill',
  overline,
  title,
  text,
  meta,
  href,
  onPick,
}: CatalogTileProps) {
  const body = (
    <>
      <span
        className={mediaFit === 'logo' ? `${styles.media} ${styles.logo}` : styles.media}
        aria-hidden="true"
      >
        {media}
      </span>
      <span className={styles.overline}>{overline}</span>
      <span className={styles.title}>{title}</span>
      <span className={styles.text}>{text}</span>
      <span className={styles.meta}>{meta}</span>
      <span className={styles.more}>
        Смотреть
        <ArrowRight size={16} strokeWidth={1.75} aria-hidden="true" />
      </span>
    </>
  )
  return href ? (
    <Link href={href} className={styles.tile}>
      {body}
    </Link>
  ) : (
    <button type="button" className={styles.tile} onClick={onPick}>
      {body}
    </button>
  )
}
