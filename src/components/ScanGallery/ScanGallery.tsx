'use client'

import { ChevronLeft, ChevronRight, Rotate3d } from 'lucide-react'
import Image from 'next/image'
import { useEffect, useRef, useState } from 'react'
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
 * Лента примеров сканов (24.10.2026, просьба владельца): в ряд целое число карточек, листаются
 * пальцем, колёсиком с Shift или стрелками — по ряду, с мягким торможением. Стрелка у края ленты
 * гаснет; все карточки влезли — стрелок нет. При прокрутке страницы карточки проступают по
 * очереди из размытия (Reveal). По нажатию скан открывается крупно в окне (ScanViewer).
 */
export function ScanGallery({ scans }: { scans: Scan[] }) {
  const track = useRef<HTMLUListElement>(null)
  const [open, setOpen] = useState<number | null>(null)
  // Можно ли листать назад и вперёд; до замера считаем, что вперёд можно.
  const [edges, setEdges] = useState({ back: false, next: true })

  useEffect(() => {
    const node = track.current
    if (!node) return
    const measure = () => {
      const max = node.scrollWidth - node.clientWidth
      setEdges({ back: node.scrollLeft > 1, next: node.scrollLeft < max - 1 })
    }
    measure()
    node.addEventListener('scroll', measure, { passive: true })
    const resize = new ResizeObserver(measure)
    resize.observe(node)
    return () => {
      node.removeEventListener('scroll', measure)
      resize.disconnect()
    }
  }, [])

  const page = (step: number) => {
    const node = track.current
    if (!node) return
    // На целый ряд: сколько карточек видно, на столько и листаем.
    const item = node.firstElementChild
    const gap = Number.parseFloat(getComputedStyle(node).columnGap) || 0
    const width = item ? item.getBoundingClientRect().width + gap : node.clientWidth
    const perView = Math.max(1, Math.round((node.clientWidth + gap) / width))
    glide(node, (Math.round(node.scrollLeft / width) + step * perView) * width)
  }

  return (
    <div className={styles.gallery}>
      {(edges.back || edges.next) && (
        <div className={styles.arrows}>
          <button
            type="button"
            className={styles.arrow}
            onClick={() => page(-1)}
            disabled={!edges.back}
            aria-label="Предыдущие сканы"
          >
            <ChevronLeft size={20} strokeWidth={1.75} aria-hidden="true" />
          </button>
          <button
            type="button"
            className={styles.arrow}
            onClick={() => page(1)}
            disabled={!edges.next}
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
                    sizes="(min-width: 960px) 400px, (min-width: 640px) 50vw, 100vw"
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
