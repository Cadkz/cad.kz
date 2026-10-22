'use client'

import { ArrowRight } from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'
import type { ReactNode } from 'react'
import type { VendorTile } from '@/lib/catalogVendors'
import type { Picture } from '@/lib/pictures'
import { Reveal } from '../Reveal/Reveal'
import styles from './VendorTiles.module.css'

type Props = {
  tiles: VendorTile[]
  logos: Record<string, Picture>
  onPick: (vendor: string) => void
}

/**
 * Шаг «производитель» в направлении каталога (решение владельца 22.10.2026): плитки с логотипом,
 * что у производителя есть и «Смотреть». Щелчок открывает его товары группами по линейкам,
 * у производителя с одной программой — сразу её страницу.
 */
export function VendorTiles({ tiles, logos, onPick }: Props) {
  return (
    <ul className={styles.grid}>
      {tiles.map((tile, index) => {
        const logo = logos[tile.title]
        const body: ReactNode = (
          <>
            <span className={styles.logoBox}>
              {logo && (
                <Image
                  src={logo.url}
                  alt=""
                  width={logo.width}
                  height={logo.height}
                  className={styles.logo}
                  unoptimized={logo.local}
                />
              )}
            </span>
            <span className={styles.title}>{tile.title}</span>
            <span className={styles.hint}>{tile.hint}</span>
            <span className={styles.more}>
              {tile.href ? 'Открыть' : 'Смотреть'}
              <ArrowRight size={16} strokeWidth={1.75} aria-hidden="true" />
            </span>
          </>
        )
        return (
          <Reveal as="li" key={tile.key} step={index % 3}>
            {tile.href ? (
              <Link href={tile.href} className={styles.tile}>
                {body}
              </Link>
            ) : (
              <button type="button" className={styles.tile} onClick={() => onPick(tile.title)}>
                {body}
              </button>
            )}
          </Reveal>
        )
      })}
    </ul>
  )
}
