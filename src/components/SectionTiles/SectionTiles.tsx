'use client'

import Image from 'next/image'
import { summaryPhrase } from '@/domain/cardTexts.mjs'
import type { SectionTile } from '@/lib/catalogFilter'
import { positions } from '@/lib/plural'
import { CatalogTile } from '../CatalogTile/CatalogTile'
import { DirectionArt, hasDirectionArt } from '../DirectionArt/DirectionArt'
import { Reveal } from '../Reveal/Reveal'
import { SectionIcon } from '../SectionIcon/SectionIcon'
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
function text(tile: SectionTile) {
  const own = summaryPhrase(tile.summary, tile.title)
  if (own) return own
  const names = tile.children.length ? tile.children : tile.vendors
  return names.slice(0, 3).join(', ') || 'Программы и оборудование раздела'
}

/**
 * Направления, типы оборудования и подразделы плитками-папками (CatalogTile): картинка, надпись,
 * название, фраза, число позиций и «Смотреть».
 */
export function SectionTiles({ tiles, overline, onPick }: Props) {
  return (
    // Четыре типа оборудования — одним рядом от 1200 px, а не 3 + 1.
    <ul className={tiles.length === 4 ? `${styles.grid} ${styles.four}` : styles.grid}>
      {tiles.map((tile, index) => (
        <Reveal as="li" key={tile.slug} step={index % 3}>
          <CatalogTile
            media={
              !tile.picture && hasDirectionArt(tile.slug) ? (
                <DirectionArt slug={tile.slug} className={styles.drawing} />
              ) : tile.picture ? (
                <Image
                  src={tile.picture.url}
                  alt=""
                  width={tile.picture.width}
                  height={tile.picture.height}
                  sizes="(min-width: 1200px) 300px, (min-width: 960px) 25vw, (min-width: 640px) 50vw, 80px"
                  unoptimized={tile.picture.local}
                  className={styles.image}
                />
              ) : (
                <SectionIcon name={tile.icon} size={24} />
              )
            }
            overline={overline}
            title={tile.title}
            text={text(tile)}
            meta={positions(tile.count)}
            onPick={() => onPick(tile.slug)}
          />
        </Reveal>
      ))}
    </ul>
  )
}
