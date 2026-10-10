import { ArrowRight } from 'lucide-react'
import Link from 'next/link'
import type { Direction } from '@/lib/catalog'
import { catalogHref } from '@/lib/navigationHrefs'
import { SectionIcon } from '../SectionIcon/SectionIcon'
import styles from './DirectionCard.module.css'

/** Карточка направления: открывает каталог, отфильтрованный по этому направлению. */
export function DirectionCard({ direction }: { direction: Direction }) {
  return (
    <Link href={catalogHref({ direction: direction.slug })} className={styles.card}>
      <span className={styles.big} aria-hidden="true">
        <SectionIcon name={direction.icon} size={24} />
      </span>
      <span className={styles.icon}>
        <SectionIcon name={direction.icon} size={20} />
      </span>
      <span className={styles.title}>{direction.title}</span>
      {direction.summary && <span className={styles.summary}>{direction.summary}</span>}
      <ArrowRight size={20} strokeWidth={1.75} aria-hidden="true" className={styles.arrow} />
    </Link>
  )
}
