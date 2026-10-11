import { ArrowRight } from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'
import type { PopularCardData } from '@/lib/popular'
import { SectionIcon } from '../SectionIcon/SectionIcon'
import styles from './PopularCard.module.css'

/**
 * Карточка «Популярных решений»: вся карточка — ссылка на товар или раздел. От 640 px —
 * плитка с картинкой; на телефоне — строка без картинки, чтобы 8 карточек не растягивали страницу.
 */
export function PopularCard({ card }: { card: PopularCardData }) {
  return (
    <Link href={card.href} className={styles.card}>
      <span className={card.picture ? styles.media : `${styles.media} ${styles.placeholder}`}>
        {card.picture ? (
          <Image
            src={card.picture.url}
            alt=""
            width={card.picture.width}
            height={card.picture.height}
            sizes="(min-width: 1200px) 260px, (min-width: 960px) 25vw, 50vw"
            className={styles.image}
          />
        ) : (
          <SectionIcon name={card.icon} size={24} />
        )}
      </span>
      <span className={styles.title}>{card.title}</span>
      {card.text && <span className={styles.text}>{card.text}</span>}
      <span className={styles.foot}>
        {card.price && <span className={styles.price}>{card.price}</span>}
        <span className={styles.action}>
          {card.label}
          <ArrowRight size={16} strokeWidth={1.75} aria-hidden="true" />
        </span>
      </span>
    </Link>
  )
}
