import { ArrowRight } from 'lucide-react'
import type { MouseEvent } from 'react'
import type { ShelfTile as Tile } from '@/lib/catalogShelves'
import { positions } from '@/lib/plural'
import { SectionIcon } from '../SectionIcon/SectionIcon'
import styles from './ShelfTile.module.css'

type Props = {
  tile: Tile
  href: string
  /** Открыть раздел без перезагрузки страницы; ссылка остаётся для новой вкладки. */
  onOpen: () => void
}

/**
 * Плитка раздела на обзоре каталога (пробная ветка redesign/catalog-v2). Одна для программ,
 * оборудования и услуг: значок раздела, название, первые программы или модели и сколько всего.
 * По названиям внутри сразу видно, что в разделе, — вместо «Смотреть».
 */
export function ShelfTile({ tile, href, onOpen }: Props) {
  const open = (event: MouseEvent<HTMLAnchorElement>) => {
    if (event.metaKey || event.ctrlKey || event.shiftKey || event.button !== 0) return
    event.preventDefault()
    onOpen()
  }
  return (
    <a href={href} className={styles.tile} onClick={open}>
      <span className={styles.icon}>
        <SectionIcon name={tile.icon} size={20} />
      </span>
      <span className={styles.title}>{tile.title}</span>
      {tile.examples.length > 0 && (
        <span className={styles.examples}>{tile.examples.join(' · ')}</span>
      )}
      <span className={styles.foot}>
        {positions(tile.count)}
        <ArrowRight size={16} strokeWidth={1.75} aria-hidden="true" />
      </span>
    </a>
  )
}
