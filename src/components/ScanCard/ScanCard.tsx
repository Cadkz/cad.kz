'use client'

import { Rotate3d } from 'lucide-react'
import { useState } from 'react'
import { ProductModel } from '../ProductModel/ProductModel'
import styles from './ScanCard.module.css'

/** Карточка скана: подложка с сеткой и названием; по нажатию на её месте появляется 3D-модель. */
export function ScanCard({ title, src }: { title: string; src: string }) {
  const [open, setOpen] = useState(false)
  return (
    <figure className={styles.card}>
      <div className={styles.media}>
        {open ? (
          <ProductModel src={src} title={title} auto />
        ) : (
          <button type="button" className={styles.open} onClick={() => setOpen(true)}>
            <Rotate3d size={24} strokeWidth={1.75} aria-hidden="true" />
            Покрутить в 3D
          </button>
        )}
      </div>
      <figcaption className={styles.title}>{title}</figcaption>
    </figure>
  )
}
