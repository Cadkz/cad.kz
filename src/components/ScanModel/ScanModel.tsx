'use client'

import { useState } from 'react'
import type { Scan } from '@/domain/artecScans.mjs'
import styles from './ScanModel.module.css'

/**
 * 3D-модель скана в окне просмотра (28.10.2026, просьба владельца — «как на artec3d.com»):
 * тот же плеер Sketchfab, что и у Artec, с прозрачным фоном поверх нашей чертёжной сетки.
 * Модель в полном разрешении, освещение и затенение — их. Плеер грузится только в открытом
 * окне; пока он поднимается, видна картинка-превью и подпись. Крутить, приближать и
 * разворачивать на весь экран — его собственными средствами.
 */
export function ScanModel({ scan }: { scan: Scan }) {
  const [loaded, setLoaded] = useState(false)

  return (
    <div className={styles.model} data-loaded={loaded}>
      {!loaded && (
        <p className={styles.loading} role="status">
          Загружаем 3D-модель…
        </p>
      )}
      <iframe
        className={styles.viewer}
        src={scan.embed}
        title={`3D-модель скана: ${scan.title}`}
        allow="autoplay; fullscreen; xr-spatial-tracking"
        allowFullScreen
        onLoad={() => setLoaded(true)}
      />
    </div>
  )
}
