'use client'

import { ArrowRight } from 'lucide-react'
import { useEffect, useState } from 'react'
import Link from '@/components/LangLink/LangLink'
import { useT } from '@/components/LangProvider/LangProvider'
import { sectionIconKey } from '@/domain/sectionArt.mjs'
import type { Direction } from '@/lib/catalog'
import { catalogHref } from '@/lib/navigationHrefs'
import { SectionIcon } from '../SectionIcon/SectionIcon'
import styles from './DirectionCard.module.css'

/** Сколько держится заливка после нажатия: хватает на переход, а при «Назад» карточка снова белая. */
const PRESSED_MS = 1500

/**
 * Карточка направления: открывает каталог, отфильтрованный по этому направлению. Белая, при
 * наведении синеет рамка; по нажатию из правого верхнего угла заливается тёмно-синий лист с
 * чертёжной сеткой и держится, пока открывается каталог (решение владельца 03.11.2026).
 */
export function DirectionCard({ direction }: { direction: Direction }) {
  const t = useT()
  const [pressed, setPressed] = useState(false)
  useEffect(() => {
    if (!pressed) return
    const timer = setTimeout(() => setPressed(false), PRESSED_MS)
    return () => clearTimeout(timer)
  }, [pressed])
  return (
    <Link
      onClick={() => setPressed(true)}
      data-pressed={pressed || undefined}
      href={direction.href ?? catalogHref({ direction: direction.slug })}
      className={styles.card}
    >
      <span className={styles.blue} aria-hidden="true" />
      <span className={styles.big} aria-hidden="true">
        <SectionIcon name={sectionIconKey(direction.slug, direction.icon)} size={80} />
      </span>
      <span className={styles.icon}>
        <SectionIcon name={sectionIconKey(direction.slug, direction.icon)} size={40} />
      </span>
      <span className={styles.title}>{direction.title}</span>
      {direction.summary && <span className={styles.summary}>{direction.summary}</span>}
      <span className={styles.cta} aria-hidden="true">
        <span className={styles.ctaInner}>
          {t('В каталог')}
          <ArrowRight size={16} strokeWidth={1.75} />
        </span>
      </span>
    </Link>
  )
}
