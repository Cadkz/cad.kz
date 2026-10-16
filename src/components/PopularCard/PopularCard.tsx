import Image from 'next/image'
import Link from 'next/link'
import type { PopularCardData } from '@/lib/popular'
import { SectionIcon } from '../SectionIcon/SectionIcon'
import styles from './PopularCard.module.css'

/**
 * Плитка «Популярных решений»: логотип и название в одну строку, высота 48 px, цвета CAD.kz.
 * У известных программ (AutoCAD, Revit, GEO5…) — логотип с сайта производителя, остальные —
 * картинка товара или значок раздела.
 */
export function PopularCard({
  card,
  onNavigate,
}: {
  card: PopularCardData
  /** В меню «Каталог»: закрыть меню при переходе. */
  onNavigate?: () => void
}) {
  return (
    <Link href={card.href} className={styles.tile} onClick={onNavigate}>
      <span className={styles.logo}>
        {card.brand ? (
          <Image
            src={card.brand.logo}
            alt=""
            width={48}
            height={48}
            unoptimized
            className={styles.image}
          />
        ) : card.picture ? (
          <Image
            src={card.picture.url}
            alt=""
            width={card.picture.width}
            height={card.picture.height}
            sizes="24px"
            className={styles.image}
          />
        ) : (
          <SectionIcon name={card.icon} size={20} />
        )}
      </span>
      {/* Неразрывный дефис: «3D-сканеры», «ЛИРА-FEM» не рвутся по дефису в узкой плитке. */}
      <span className={styles.title}>{card.title.replaceAll('-', '\u2011')}</span>
    </Link>
  )
}
