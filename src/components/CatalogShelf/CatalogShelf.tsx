import { ArrowRight } from 'lucide-react'
import Image from 'next/image'
import type { CatalogItem } from '@/lib/catalog'
import type { Shelf } from '@/lib/catalogShelves'
import type { Picture } from '@/lib/pictures'
import { positions } from '@/lib/plural'
import { CatalogCards } from '../CatalogCards/CatalogCards'
import styles from './CatalogShelf.module.css'

type Props = {
  shelf: Shelf
  logo?: Picture
  all: CatalogItem[]
  /** Сколько карточек видно; остальные — на странице производителя или подраздела. */
  limit: number
  onPick: () => void
}

/**
 * Полка раздела (пробная ветка redesign/catalog-v2): производитель с логотипом и его карточки
 * сразу, без отдельного шага «выберите производителя». Если карточек больше limit — первые,
 * по «Все N» открываются все, группами по линейкам.
 */
export function CatalogShelf({ shelf, logo, all, limit, onPick }: Props) {
  const more = shelf.items.length > limit + 1
  const shown = more ? shelf.items.slice(0, limit) : shelf.items
  return (
    <section className={styles.shelf} aria-label={shelf.title || 'Другие позиции'}>
      {shelf.title && (
        <div className={styles.head}>
          {logo && (
            <span className={styles.logoBox}>
              <Image
                src={logo.url}
                alt=""
                width={logo.width}
                height={logo.height}
                unoptimized={logo.local}
                className={styles.logo}
              />
            </span>
          )}
          <h3 className={styles.title}>{shelf.title}</h3>
          <span className={styles.count}>{positions(shelf.items.length)}</span>
          {more && (
            <button type="button" className={styles.all} onClick={onPick}>
              Все {shelf.items.length}
              <ArrowRight size={16} strokeWidth={1.75} aria-hidden="true" />
            </button>
          )}
        </div>
      )}
      <CatalogCards items={shown} all={all} />
    </section>
  )
}
