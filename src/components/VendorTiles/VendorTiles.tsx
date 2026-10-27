'use client'

import Image from 'next/image'
import type { VendorTile } from '@/lib/catalogVendors'
import type { Picture } from '@/lib/pictures'
import { positions } from '@/lib/plural'
import { CatalogTile } from '../CatalogTile/CatalogTile'
import { Reveal } from '../Reveal/Reveal'
import styles from './VendorTiles.module.css'

type Props = {
  tiles: VendorTile[]
  logos: Record<string, Picture>
  onPick: (vendor: string) => void
}

/**
 * Шаг «производитель» в направлении каталога (решение владельца 22.10.2026): плитки-папки
 * (CatalogTile) по единому правилу — логотип, «Производитель», название, что внутри, число
 * позиций и «Смотреть». Щелчок открывает его товары группами по линейкам, у производителя
 * с одной программой — сразу её страницу.
 */
export function VendorTiles({ tiles, logos, onPick }: Props) {
  return (
    <ul className={styles.grid}>
      {tiles.map((tile, index) => {
        const logo = logos[tile.title]
        return (
          <Reveal as="li" key={tile.key} step={index % 3}>
            <CatalogTile
              media={
                logo ? (
                  <Image
                    src={logo.url}
                    alt=""
                    width={logo.width}
                    height={logo.height}
                    className={styles.logo}
                    unoptimized={logo.local}
                  />
                ) : (
                  <span className={styles.logoFallback}>{tile.title}</span>
                )
              }
              mediaFit="logo"
              overline="Производитель"
              title={tile.title}
              text={tile.text || 'Программы производителя'}
              meta={positions(tile.count)}
              href={tile.href}
              onPick={() => onPick(tile.title)}
            />
          </Reveal>
        )
      })}
    </ul>
  )
}
