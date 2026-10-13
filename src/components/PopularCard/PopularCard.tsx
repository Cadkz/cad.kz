import Image from 'next/image'
import Link from 'next/link'
import type { PopularCardData } from '@/lib/popular'
import { SectionIcon } from '../SectionIcon/SectionIcon'
import styles from './PopularCard.module.css'

/**
 * Плитка «Популярных решений»: логотип и название в одну строку, высота 64 px.
 * У известных программ (AutoCAD, Revit, GEO5…) — логотип с сайта производителя и фирменный
 * цвет: лёгкая подложка, рамка и полоска слева. Остальные — картинка товара или значок раздела.
 */
export function PopularCard({
  card,
  onNavigate,
}: {
  card: PopularCardData
  /** В мегаменю: закрыть меню при переходе. */
  onNavigate?: () => void
}) {
  const brandClass = card.brand ? styles[card.brand.key] : undefined
  return (
    <Link
      href={card.href}
      onClick={onNavigate}
      className={[styles.tile, card.brand && styles.branded, brandClass].filter(Boolean).join(' ')}
    >
      <span className={styles.logo}>
        {card.brand ? (
          <Image
            src={card.brand.logo}
            alt=""
            width={80}
            height={80}
            unoptimized
            className={styles.image}
          />
        ) : card.picture ? (
          <Image
            src={card.picture.url}
            alt=""
            width={card.picture.width}
            height={card.picture.height}
            sizes="48px"
            className={styles.image}
          />
        ) : (
          <SectionIcon name={card.icon} size={24} />
        )}
      </span>
      {/* Неразрывный дефис: «3D-сканеры», «ЛИРА-FEM» не рвутся по дефису в узкой плитке. */}
      <span className={styles.title}>{card.title.replaceAll('-', '\u2011')}</span>
    </Link>
  )
}
