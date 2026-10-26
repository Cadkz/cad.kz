'use client'

import { ArrowRight } from 'lucide-react'
import Image from 'next/image'
import type { SectionTile } from '@/lib/catalogFilter'
import type { Picture } from '@/lib/pictures'
import { positions } from '@/lib/plural'
import { DirectionArt, hasDirectionArt } from '../DirectionArt/DirectionArt'
import { Reveal } from '../Reveal/Reveal'
import { SectionIcon } from '../SectionIcon/SectionIcon'
import styles from './SectionTiles.module.css'

type Props = {
  tiles: SectionTile[]
  /** Логотипы производителей: у направлений программ — строкой на чертеже. */
  logos?: Record<string, Picture>
  onPick: (slug: string) => void
}

/** Сколько логотипов производителей показывать на плитке направления. */
const TILE_LOGOS = 3

/** Подпись плитки: описание из админки, иначе подразделы или производители и число позиций. */
function hint(tile: SectionTile) {
  if (tile.summary) return tile.summary
  if (tile.children.length) return tile.children.join(' · ')
  return [tile.vendors.slice(0, 3).join(', '), positions(tile.count)].filter(Boolean).join(' · ')
}

/** Логотипы первых производителей направления — белыми плашками по нижнему краю чертежа. */
function TileLogos({ vendors, logos }: { vendors: string[]; logos: Record<string, Picture> }) {
  const shown = vendors.flatMap((vendor) => {
    const logo = logos[vendor]
    return logo ? [{ vendor, logo }] : []
  })
  if (!shown.length) return null
  return (
    <span className={styles.logos}>
      {shown.slice(0, TILE_LOGOS).map(({ vendor, logo }) => (
        <span key={vendor} className={styles.logoChip}>
          <Image
            src={logo.url}
            alt=""
            width={logo.width}
            height={logo.height}
            unoptimized={logo.local}
            className={styles.logo}
          />
        </span>
      ))}
    </span>
  )
}

/**
 * Типы оборудования и подразделы плитками, как папки в Битриксе (замечание владельца 22.10.2026):
 * фото первого товара раздела, название, подпись и «Смотреть». На телефоне фото слева, как
 * у карточек товаров, от 640 px — сверху.
 */
export function SectionTiles({ tiles, logos = {}, onPick }: Props) {
  return (
    // Четыре типа оборудования — одним рядом от 1200 px, а не 3 + 1.
    <ul className={tiles.length === 4 ? `${styles.grid} ${styles.four}` : styles.grid}>
      {tiles.map((tile, index) => (
        <Reveal as="li" key={tile.slug} step={index % 3}>
          <button type="button" className={styles.tile} onClick={() => onPick(tile.slug)}>
            {!tile.picture && hasDirectionArt(tile.slug) ? (
              <span className={`${styles.media} ${styles.art}`} aria-hidden="true">
                <DirectionArt slug={tile.slug} className={styles.drawing} />
                <TileLogos vendors={tile.vendors} logos={logos} />
              </span>
            ) : (
              <span className={styles.media} aria-hidden="true">
                {tile.picture ? (
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
                )}
              </span>
            )}
            <span className={styles.title}>{tile.title}</span>
            <span className={styles.hint}>{hint(tile)}</span>
            <span className={styles.more}>
              Смотреть
              <ArrowRight size={16} strokeWidth={1.75} aria-hidden="true" />
            </span>
          </button>
        </Reveal>
      ))}
    </ul>
  )
}
