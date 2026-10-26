'use client'

import { ArrowLeft, ArrowRight } from 'lucide-react'
import Link from 'next/link'
import type { CatalogItem, CatalogLine, Facet } from '@/lib/catalog'
import type { FilterState } from '@/lib/catalogFilter'
import { sectionView } from '@/lib/catalogShelves'
import type { Picture } from '@/lib/pictures'
import { positions } from '@/lib/plural'
import { CatalogCards } from '../CatalogCards/CatalogCards'
import { CatalogShelf } from '../CatalogShelf/CatalogShelf'
import { Chip } from '../Chip/Chip'
import styles from './CatalogSection.module.css'

type Props = {
  state: FilterState
  items: CatalogItem[]
  facets: Facet[]
  lines: CatalogLine[]
  vendorLogos: Record<string, Picture>
  onChange: (change: Partial<FilterState>) => void
  onHome: () => void
}

/** Сколько карточек на полке: у первого производителя два ряда, у остальных один. */
const FIRST_SHELF = 6
const SHELF_LIMIT = 3

/**
 * Открытый раздел (пробная ветка redesign/catalog-v2): заголовок и пояснение раздела, плашки
 * производителей (или подразделов) для быстрого выбора и сразу товары — полками по
 * производителям. Выбран производитель — все его позиции группами по линейкам; выбраны задачи
 * или характеристики — общий список.
 */
export function CatalogSection({
  state,
  items,
  facets,
  lines,
  vendorLogos,
  onChange,
  onHome,
}: Props) {
  const { head, chipsAre, chips, flat, groups, shelves, total } = sectionView(
    items,
    facets,
    lines,
    state,
  )

  return (
    <div className={styles.root}>
      <header className={styles.head}>
        <button type="button" className={styles.back} onClick={onHome}>
          <ArrowLeft size={16} strokeWidth={1.75} aria-hidden="true" />
          Весь каталог
        </button>
        <h2 className={styles.title}>{head?.title ?? 'Каталог'}</h2>
        {head?.summary && <p className={styles.summary}>{head.summary}</p>}
        <p className={styles.count} aria-live="polite">
          {positions(total)}
        </p>
      </header>
      {chips.length > 0 && (
        <fieldset className={styles.chips}>
          <legend className="visually-hidden">{chipsAre}</legend>
          {chips.map((chip) => (
            <Chip key={chip.key} selected={chip.selected} onClick={() => onChange(chip.pick)}>
              {chip.label}
            </Chip>
          ))}
        </fieldset>
      )}
      {flat ? (
        <CatalogCards items={flat} all={items} />
      ) : groups ? (
        <div className={styles.shelves}>
          {groups.map((group) => (
            <section key={group.key} className={styles.group} aria-label={group.title || undefined}>
              {(group.title || group.href) && (
                <div className={styles.groupHead}>
                  {group.title && <h3 className={styles.groupTitle}>{group.title}</h3>}
                  {group.href && (
                    <Link href={group.href} className={styles.family}>
                      Выбрать несколько на одной странице
                      <ArrowRight size={16} strokeWidth={1.75} aria-hidden="true" />
                    </Link>
                  )}
                </div>
              )}
              <CatalogCards items={group.items} all={items} />
            </section>
          ))}
        </div>
      ) : (
        <div className={styles.shelves}>
          {shelves.map((shelf, index) => (
            <CatalogShelf
              key={shelf.key}
              shelf={shelf}
              logo={vendorLogos[shelf.title]}
              all={items}
              limit={
                shelves.length === 1 || !shelf.title
                  ? shelf.items.length
                  : index === 0
                    ? FIRST_SHELF
                    : SHELF_LIMIT
              }
              onPick={() => onChange(shelf.pick)}
            />
          ))}
        </div>
      )}
    </div>
  )
}
