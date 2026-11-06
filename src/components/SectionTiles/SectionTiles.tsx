'use client'

import Image from 'next/image'
import { useT } from '@/components/LangProvider/LangProvider'
import { summaryPhrase } from '@/domain/cardTexts.mjs'
import type { SectionTile } from '@/lib/catalogFilter'
import { positions } from '@/lib/plural'
import { CatalogTile } from '../CatalogTile/CatalogTile'
import { Reveal } from '../Reveal/Reveal'
import { SectionArt } from '../SectionArt/SectionArt'
import styles from './SectionTiles.module.css'

type Props = {
  tiles: SectionTile[]
  /** Надпись над названием: «Направление» или «Раздел». */
  overline: string
  onPick: (slug: string) => void
}

/**
 * Фраза плитки по единому правилу: описание раздела из админки одной законченной фразой, иначе —
 * что внутри (подразделы или производители, до трёх).
 */
function text(tile: SectionTile, t: (text: string) => string) {
  const own = summaryPhrase(tile.summary, tile.title)
  if (own) return own
  const names = tile.children.length ? tile.children : tile.vendors
  return names.slice(0, 3).map(t).join(', ') || t('Программы и оборудование раздела')
}

/**
 * Направления, типы оборудования и подразделы плитками-папками (CatalogTile): картинка, надпись,
 * название, фраза, число позиций и «Смотреть».
 */
export function SectionTiles({ tiles, overline, onPick }: Props) {
  const t = useT()
  return (
    // Сетка одна на весь каталог — по 3 в ряд, и у типов оборудования (правка владельца 02.11.2026).
    <ul data-grid="" className={styles.grid}>
      {tiles.map((tile, index) => (
        <Reveal as="li" key={tile.slug} step={index % 3}>
          <CatalogTile
            media={
              tile.picture ? (
                <Image
                  src={tile.picture.url}
                  alt=""
                  width={tile.picture.width}
                  height={tile.picture.height}
                  sizes="96px"
                  unoptimized={tile.picture.local}
                  className={styles.image}
                />
              ) : (
                <SectionArt
                  slug={tile.slug}
                  icon={tile.icon}
                  size={96}
                  className={styles.drawing}
                />
              )
            }
            mediaFit={!tile.picture || tile.picture.fit !== 'logo' ? 'photo' : 'fill'}
            overline={overline}
            title={t(tile.title)}
            text={text(tile, t)}
            meta={positions(tile.count, t)}
            onPick={() => onPick(tile.slug)}
          />
        </Reveal>
      ))}
    </ul>
  )
}
