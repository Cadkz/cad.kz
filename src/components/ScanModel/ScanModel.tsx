'use client'

import { Minus, Plus, RotateCcw } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import type { Scan } from '@/domain/artecScans.mjs'
import { ScanProgress } from '../ScanProgress/ScanProgress'
import type { ModelViewerElement } from './model-viewer'
import styles from './ScanModel.module.css'

/** Шаг кнопок «+» и «−»: расстояние камеры меняется на четверть. */
const ZOOM_STEP = 0.75

/**
 * 3D-модель скана в окне просмотра. Просмотрщик (веб-компонент Google model-viewer, ~290 КБ)
 * грузится только при первом открытии окна. Модель медленно вращается, пока её не тронули:
 * первое касание, колесо или кнопки «+ / −» останавливают вращение (просьба владельца
 * 24.10.2026). Колесо и щипок приближают, «⟲» возвращает исходный ракурс. Сканы в полном
 * качестве (28.10.2026) весят 5–15 МБ — пока модель грузится, поверх картинки идёт полоска.
 */
export function ScanModel({ scan }: { scan: Scan }) {
  const [ready, setReady] = useState(false)
  const [touched, setTouched] = useState(false)
  const [progress, setProgress] = useState(0)
  const viewer = useRef<ModelViewerElement>(null)

  useEffect(() => {
    let alive = true
    // Сканы сжаты Draco; декодер (~250 КБ) лежит на нашем сайте, а не на gstatic.com.
    // model-viewer читает адрес из глобальной настройки один раз, при загрузке модуля.
    const config = globalThis as { ModelViewerElement?: { dracoDecoderLocation?: string } }
    config.ModelViewerElement = { ...config.ModelViewerElement, dracoDecoderLocation: '/draco/' }
    import('@google/model-viewer').then(() => alive && setReady(true))
    return () => {
      alive = false
    }
  }, [])

  useEffect(() => {
    const node = viewer.current
    if (!ready || !node) return
    const onChange = (event: Event) => {
      const source = (event as CustomEvent<{ source?: string }>).detail?.source
      if (source !== 'user-interaction') return
      node.autoRotate = false
      setTouched(true)
    }
    const onProgress = (event: Event) => {
      const total = (event as CustomEvent<{ totalProgress?: number }>).detail?.totalProgress
      if (typeof total === 'number') setProgress(total)
    }
    const onLoad = () => setProgress(1)
    node.addEventListener('camera-change', onChange)
    node.addEventListener('progress', onProgress)
    node.addEventListener('load', onLoad)
    return () => {
      node.removeEventListener('camera-change', onChange)
      node.removeEventListener('progress', onProgress)
      node.removeEventListener('load', onLoad)
    }
  }, [ready])

  const zoom = (factor: number) => {
    const node = viewer.current
    if (!node) return
    const { theta, phi, radius } = node.getCameraOrbit()
    node.autoRotate = false
    node.cameraOrbit = `${theta}rad ${phi}rad ${radius * factor}m`
    setTouched(true)
  }

  const reset = () => {
    const node = viewer.current
    if (!node) return
    node.cameraOrbit = scan.orbit
  }

  return (
    <div className={styles.model} data-ready={ready}>
      {ready ? (
        <model-viewer
          ref={viewer}
          src={scan.src}
          poster={scan.poster}
          alt={`3D-модель скана: ${scan.title}`}
          camera-controls
          auto-rotate
          auto-rotate-delay="0"
          rotation-per-second="14deg"
          camera-orbit={scan.orbit}
          min-camera-orbit="auto auto 0.2m"
          max-camera-orbit="auto auto 4m"
          orientation={scan.orientation}
          touch-action="none"
          interaction-prompt="none"
          shadow-intensity="0.6"
          exposure="1"
          className={styles.viewer}
        />
      ) : (
        <p className={styles.loading} role="status">
          Загружаем 3D-модель…
        </p>
      )}
      {ready && progress < 1 && <ScanProgress value={progress} />}
      <p className={styles.hint} data-hidden={touched || progress < 1}>
        Крутите мышью или пальцем, колесо или щипок — приблизить
      </p>
      <div className={styles.controls}>
        <button
          type="button"
          className={styles.control}
          onClick={() => zoom(ZOOM_STEP)}
          aria-label="Приблизить"
        >
          <Plus size={20} strokeWidth={1.75} aria-hidden="true" />
        </button>
        <button
          type="button"
          className={styles.control}
          onClick={() => zoom(1 / ZOOM_STEP)}
          aria-label="Отдалить"
        >
          <Minus size={20} strokeWidth={1.75} aria-hidden="true" />
        </button>
        <button
          type="button"
          className={styles.control}
          onClick={reset}
          aria-label="Исходный ракурс"
        >
          <RotateCcw size={20} strokeWidth={1.75} aria-hidden="true" />
        </button>
      </div>
    </div>
  )
}
