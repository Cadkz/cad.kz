'use client'

import { ChevronLeft, ChevronRight, Rotate3d } from 'lucide-react'
import Image from 'next/image'
import { useRef, useState } from 'react'
import type { Scan } from '@/domain/artecScans.mjs'
import { Reveal } from '../Reveal/Reveal'
import { ScanViewer } from '../ScanViewer/ScanViewer'
import styles from './ScanGallery.module.css'

/** Время листания стрелками: медленнее браузерного smooth, с мягким торможением. */
const DURATION = 720

/** Плавное торможение в конце листания (как --ease-reveal). */
const easeOut = (t: number) => 1 - (1 - t) ** 4

/**
 * Листает ленту к позиции сами, по кадрам: браузерный smooth слишком резкий и у всех разный.
 * Привязка к карточкам на время листания снимается, иначе лента дёргается.
 */
function glide(node: HTMLElement, target: number) {
  const from = node.scrollLeft
  const to = Math.max(0, Math.min(target, node.scrollWidth - node.clientWidth))
  if (from === to) return
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    node.scrollLeft = to
    return
  }
  const started = performance.now()
  node.dataset.gliding = 'true'
  const frame = (now: number) => {
    const t = Math.min(1, (now - started) / DURATION)
    node.scrollLeft = from + (to - from) * easeOut(t)
    if (t < 1) requestAnimationFrame(frame)
    else delete node.dataset.gliding
  }
  requestAnimationFrame(frame)
}

/**
 * Лента примеров сканов (24.10.2026, просьба владельца): превью листаются влево-вправо —
 * пальцем, колёсиком с Shift или стрелками (по одной карточке, с мягким торможением); карточки
 * у краёв ленты уменьшаются, гаснут и размываются, превью внутри плывёт, как за стеклом. При
 * прокрутке страницы карточки проступают по очереди из размытия (Reveal). По нажатию скан открывается крупно в окне (ScanViewer).
 */
export function ScanGallery({ scans }: { scans: Scan[] }) {
  const track = useRef<HTMLUListElement>(null)
  const [open, setOpen] = useState<number | null>(null)

  const page = (step: number) => {
    const node = track.current
    if (!node) return
    // На одну карточку: видно, как следующая выезжает на место предыдущей.
    const item = node.firstElementChild
    const gap = Number.parseFloat(getComputedStyle(node).columnGap) || 0
    const width = item ? item.getBoundingClientRect().width + gap : node.clientWidth
    glide(node, Math.round(node.scrollLeft / width + step) * width)
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
            <Reveal step={Math.min(index, 3)}>
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
            </Reveal>
          </li>
        ))}
      </ul>
      <ScanViewer scans={scans} index={open} onChange={setOpen} />
    </div>
  )
}
