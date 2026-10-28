'use client'

import { ChevronLeft, ChevronRight, X } from 'lucide-react'
import { useCallback, useEffect, useRef } from 'react'
import type { Scan } from '@/domain/artecScans.mjs'
import { ScanModel } from '../ScanModel/ScanModel'
import styles from './ScanViewer.module.css'

type Props = { scans: Scan[]; index: number | null; onChange: (index: number | null) => void }

/** Метка своей записи в истории браузера: «назад» закрывает окно, а не уводит со страницы. */
const MARK = 'cadScanViewer'

/**
 * Окно просмотра скана (24.10.2026, просьба владельца): модель крупно на тёмно-синем фоне
 * с сеткой (с 28.10.2026 — плеер Sketchfab, как на artec3d.com), стрелки листают сканы. Закрывается крестиком,
 * клавишей Esc, нажатием мимо окна и кнопкой «Назад» — в браузере, на мыши и на телефоне:
 * при открытии в историю добавляется запись с тем же адресом, «назад» её снимает.
 */
export function ScanViewer({ scans, index, onChange }: Props) {
  const dialog = useRef<HTMLDialogElement>(null)
  const scan = index === null ? null : scans[index]

  const close = useCallback(() => {
    if (window.history.state?.[MARK]) window.history.back()
    else onChange(null)
  }, [onChange])

  useEffect(() => {
    const node = dialog.current
    if (!node) return
    if (index !== null && !node.open) {
      node.showModal()
      // Состояние роутера Next.js сохраняем, иначе «назад» перезагрузит страницу.
      window.history.pushState({ ...window.history.state, [MARK]: true }, '')
    }
    if (index === null && node.open) node.close()
  }, [index])

  useEffect(() => {
    const onPop = () => {
      if (dialog.current?.open) onChange(null)
    }
    window.addEventListener('popstate', onPop)
    return () => window.removeEventListener('popstate', onPop)
  }, [onChange])

  const step = (delta: number) =>
    onChange(index === null ? null : (index + delta + scans.length) % scans.length)

  return (
    <dialog
      ref={dialog}
      className={styles.dialog}
      aria-label={scan ? `3D-модель: ${scan.title}` : 'Просмотр скана'}
      onCancel={(event) => {
        event.preventDefault()
        close()
      }}
      onClick={(event) => {
        if (event.target === event.currentTarget) close()
      }}
      onKeyDown={(event) => {
        if (event.key === 'ArrowRight') step(1)
        if (event.key === 'ArrowLeft') step(-1)
      }}
    >
      {scan && (
        <div className={styles.frame}>
          <ScanModel key={scan.id} scan={scan} />
          <div className={styles.top}>
            <p className={styles.title}>
              {scan.title}
              {scans.length > 1 && (
                <span className={styles.counter}>
                  {(index ?? 0) + 1} из {scans.length}
                </span>
              )}
            </p>
            <button type="button" className={styles.control} onClick={close} aria-label="Закрыть">
              <X size={20} strokeWidth={1.75} aria-hidden="true" />
            </button>
          </div>
          {scans.length > 1 && (
            <>
              <button
                type="button"
                className={`${styles.control} ${styles.prev}`}
                onClick={() => step(-1)}
                aria-label="Предыдущий скан"
              >
                <ChevronLeft size={20} strokeWidth={1.75} aria-hidden="true" />
              </button>
              <button
                type="button"
                className={`${styles.control} ${styles.next}`}
                onClick={() => step(1)}
                aria-label="Следующий скан"
              >
                <ChevronRight size={20} strokeWidth={1.75} aria-hidden="true" />
              </button>
            </>
          )}
        </div>
      )}
    </dialog>
  )
}
