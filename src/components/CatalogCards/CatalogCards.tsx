import type { CatalogItem } from '@/lib/catalog'
import { cardInfo } from '@/lib/catalogShelves'
import { CatalogCard } from '../CatalogCard/CatalogCard'
import { Reveal } from '../Reveal/Reveal'
import styles from './CatalogCards.module.css'

type Props = {
  items: CatalogItem[]
  /** Весь каталог: из него берётся состав линеек для карточек. */
  all: CatalogItem[]
}

/** Сетка карточек каталога: одна колонка на телефоне, две от 640 px, три от 1200 px. */
export function CatalogCards({ items, all }: Props) {
  return (
    <ul className={styles.grid}>
      {items.map((item, index) => (
        <Reveal as="li" key={item.id} step={index % 3}>
          <CatalogCard product={item} info={cardInfo(item, all)} />
        </Reveal>
      ))}
    </ul>
  )
}
