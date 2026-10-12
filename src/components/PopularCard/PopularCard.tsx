import Image from 'next/image'
import Link from 'next/link'
import type { PopularCardData } from '@/lib/popular'
import { SectionIcon } from '../SectionIcon/SectionIcon'
import styles from './PopularCard.module.css'

/**
 * Плитка «Популярных решений»: маленький логотип и название, как плитки производителей.
 * Вся плитка — ссылка на товар или в каталог.
 */
export function PopularCard({ card }: { card: PopularCardData }) {
  return (
    <Link href={card.href} className={styles.tile}>
      <span className={styles.logo}>
        {card.picture ? (
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
      <span className={styles.title}>{card.title}</span>
    </Link>
  )
}
