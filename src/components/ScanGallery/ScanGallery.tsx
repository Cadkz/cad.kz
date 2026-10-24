'use client'

import { ChevronLeft, ChevronRight, Rotate3d } from 'lucide-react'
import Image from 'next/image'
import { useRef, useState } from 'react'
import type { Scan } from '@/domain/artecScans.mjs'
import { ScanViewer } from '../ScanViewer/ScanViewer'
import styles from './ScanGallery.module.css'

/**
 * Лента примеров сканов (24.10.2026, просьба владельца): превью листаются влево-вправо —
 * пальцем, колёсиком с Shift или стрелками; карточки у краёв ленты уменьшаются и гаснут,
 * превью внутри плывёт, как за стеклом. По нажатию скан открывается крупно в окне (ScanViewer).
 */
export function ScanGallery({ scans }: { scans: Scan[] }) {
  const track = useRef<HTMLUListElement>(null)
  const [open, setOpen] = useState<number | null>(null)

  const page = (step: number) => {
    const node = track.current
    if (!node) return
    node.scrollBy({ left: step * node.clientWidth * 0.8, behavior: 'smooth' })
  }

  return (
    <div className={styles.gallery}>
      {scans.length > 1 && (
        <div className={styles.arrows}>
          <button
            type="button"
            className={styles.arrow}
            onClick={() => page(-1)}
            aria-label="Предыдущие сканы"
          >
            <ChevronLeft size={20} strokeWidth={1.75} aria-hidden="true" />
          </button>
          <button
            type="button"
            className={styles.arrow}
            onClick={() => page(1)}
            aria-label="Следующие сканы"
          >
            <ChevronRight size={20} strokeWidth={1.75} aria-hidden="true" />
          </button>
        </div>
      )}
      <ul ref={track} className={styles.track}>
        {scans.map((scan, index) => (
          <li key={scan.id} className={styles.item}>
            <button
              type="button"
              className={styles.card}
              onClick={() => setOpen(index)}
              aria-label={`Открыть 3D-модель: ${scan.title}`}
            >
              <span className={styles.stage}>
                <Image
                  src={scan.poster}
                  alt=""
                  width={640}
                  height={480}
                  sizes="(min-width: 960px) 280px, (min-width: 640px) 45vw, 80vw"
                  className={styles.poster}
                />
                <span className={styles.badge}>
                  <Rotate3d size={16} strokeWidth={1.75} aria-hidden="true" />
                  3D
                </span>
              </span>
              <span className={styles.title}>{scan.title}</span>
            </button>
          </li>
        ))}
      </ul>
      <ScanViewer scans={scans} index={open} onChange={setOpen} />
    </div>
  )
}
