'use client'

import { Rotate3d } from 'lucide-react'
import { useEffect, useState } from 'react'
import styles from './ProductModel.module.css'

type Props = {
  src: string
  title: string
  /** Сразу показывать модель (у товара нет вырезанного фото) или по кнопке поверх фото. */
  auto: boolean
  onOpen?: () => void
}

/**
 * 3D-модель оборудования, которую можно покрутить мышью или пальцем (пробная ветка, 23.10.2026).
 * Просмотрщик (веб-компонент Google model-viewer, ~290 КБ) грузится только здесь и только когда
 * модель нужна: по кнопке «Покрутить в 3D» или сразу, если вместо фото — модель. На скорость
 * остальных страниц не влияет. Без JavaScript и при «меньше движения» модель не вращается сама.
 */
export function ProductModel({ src, title, auto, onOpen }: Props) {
  const [ready, setReady] = useState(false)
  const [open, setOpen] = useState(auto)

  useEffect(() => {
    if (!open) return
    let alive = true
    import('@google/model-viewer').then(() => alive && setReady(true))
    return () => {
      alive = false
    }
  }, [open])

  if (!open)
    return (
      <button
        type="button"
        className={styles.toggle}
        onClick={() => {
          setOpen(true)
          onOpen?.()
        }}
      >
        <Rotate3d size={16} strokeWidth={1.75} aria-hidden="true" />
        Покрутить в 3D
      </button>
    )

  return (
    <div className={styles.viewer} data-ready={ready}>
      {ready ? (
        <model-viewer
          src={src}
          alt={`3D-модель: ${title}`}
          camera-controls
          auto-rotate
          auto-rotate-delay="0"
          rotation-per-second="18deg"
          touch-action="pan-y"
          interaction-prompt="none"
          shadow-intensity="0.6"
          exposure="1.05"
          disable-zoom
          className={styles.model}
        />
      ) : (
        <p className={styles.loading} role="status">
          Загружаем 3D-модель…
        </p>
      )}
      <p className={styles.hint}>Крутите мышью или пальцем</p>
    </div>
  )
}
