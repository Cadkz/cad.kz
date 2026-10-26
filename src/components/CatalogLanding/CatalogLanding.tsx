import type { FilterState } from '@/lib/catalogFilter'
import { toQuery } from '@/lib/catalogFilter'
import { type PopularEntry, type ShelfTile as Tile, tileState } from '@/lib/catalogShelves'
import { CatalogCard } from '../CatalogCard/CatalogCard'
import { Reveal } from '../Reveal/Reveal'
import { ShelfTile } from '../ShelfTile/ShelfTile'
import styles from './CatalogLanding.module.css'

type Props = {
  popular: PopularEntry[]
  shelves: { software: Tile[]; hardware: Tile[]; service: Tile[] }
  onOpen: (next: FilterState) => void
}

const BLOCKS = [
  { key: 'software', title: 'Программы по задачам' },
  { key: 'hardware', title: 'Оборудование' },
  { key: 'service', title: 'Обучение и услуги' },
] as const

/**
 * Первый экран каталога (пробная ветка redesign/catalog-v2): популярные решения теми же
 * карточками, что весь каталог, ниже все разделы плитками одного вида — с примерами внутри,
 * чтобы раздел было понятно до щелчка.
 */
export function CatalogLanding({ popular, shelves, onOpen }: Props) {
  return (
    <div className={styles.root}>
      {popular.length > 0 && (
        <section className={styles.block} aria-labelledby="catalog-popular">
          <h2 id="catalog-popular" className={styles.title}>
            Популярные решения
          </h2>
          <ul className={styles.cards}>
            {popular.map((entry, index) => (
              <Reveal as="li" key={entry.item.id} step={index % 3}>
                <CatalogCard
                  product={entry.item}
                  info={entry.info}
                  note={entry.note ?? undefined}
                />
              </Reveal>
            ))}
          </ul>
        </section>
      )}
      {BLOCKS.map((block) =>
        shelves[block.key].length ? (
          <section
            key={block.key}
            className={styles.block}
            aria-labelledby={`catalog-${block.key}`}
          >
            <h2 id={`catalog-${block.key}`} className={styles.title}>
              {block.title}
            </h2>
            <ul className={styles.tiles}>
              {shelves[block.key].map((tile, index) => (
                <Reveal as="li" key={tile.slug} step={index % 3}>
                  <ShelfTile
                    tile={tile}
                    href={`/catalog?${toQuery(tileState(tile))}`}
                    onOpen={() => onOpen(tileState(tile))}
                  />
                </Reveal>
              ))}
            </ul>
          </section>
        ) : null,
      )}
    </div>
  )
}
