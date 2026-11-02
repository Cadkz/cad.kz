import { ArrowRight } from 'lucide-react'
import Link from 'next/link'
import type { Direction } from '@/lib/catalog'
import { catalogHref } from '@/lib/navigationHrefs'
import { SectionIcon } from '../SectionIcon/SectionIcon'
import styles from './DirectionCard.module.css'

/**
 * Карточка направления: открывает каталог, отфильтрованный по этому направлению. Белая; при
 * наведении из правого верхнего угла раскрывается тёмно-синий лист с чертёжной сеткой, выезжает
 * «В каталог» (выбор владельца 02.11.2026). Карточка не прыгает.
 */
export function DirectionCard({ direction }: { direction: Direction }) {
  return (
    <Link
      href={direction.href ?? catalogHref({ direction: direction.slug })}
      className={styles.card}
    >
      <span className={styles.blue} aria-hidden="true" />
      <span className={styles.big} aria-hidden="true">
        <SectionIcon name={direction.icon} size={24} />
      </span>
      <span className={styles.icon}>
        <SectionIcon name={direction.icon} size={20} />
      </span>
      <span className={styles.title}>{direction.title}</span>
      {direction.summary && <span className={styles.summary}>{direction.summary}</span>}
      <span className={styles.cta} aria-hidden="true">
        <span className={styles.ctaInner}>
          В каталог
          <ArrowRight size={16} strokeWidth={1.75} />
        </span>
      </span>
    </Link>
  )
}
