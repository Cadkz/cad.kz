'use client'

import { ChevronLeft, ChevronRight, Contrast, Maximize2, Palette } from 'lucide-react'
import Image from 'next/image'
import { type PointerEvent, type ReactNode, useRef, useState } from 'react'
import type { Picture } from '@/lib/pictures'
import type { Fact } from '@/lib/product'
import { PictureViewer } from '../PictureViewer/PictureViewer'
import styles from './ProductStage.module.css'

type Props = {
  title: string
  pictures: Picture[]
  facts: Fact[]
  /** Что показать на листе, пока картинок нет (значок раздела). */
  placeholder?: ReactNode
}

/** Сдвиг пальцем, после которого лента листается. */
const SWIPE = 40

/**
 * Сцена первого экрана любого товара (решение владельца 24.10.2026): голубой лист с разметкой,
 * картинки листаются стрелками и пальцем — уходят вбок в размытие, новая выплывает из него;
 * нажатие открывает картинку крупно (PictureViewer). Под картинкой — главные факты строкой (27.10.2026), у плоттеров пять, цветность со значком (30.10.2026). При прокрутке
 * фото отстаёт от сетки листа — глубина без JavaScript (CSS).
 */
export function ProductStage({ title, pictures, facts, placeholder }: Props) {
  const [active, setActive] = useState(0)
  const [open, setOpen] = useState<number | null>(null)
  const start = useRef<number | null>(null)
  const count = pictures.length

  const step = (delta: number) => setActive((index) => (index + delta + count) % count)

  const onDown = (event: PointerEvent) => {
    start.current = event.clientX
  }
  const onUp = (event: PointerEvent) => {
    if (start.current === null) return
    const shift = event.clientX - start.current
    start.current = null
    if (count > 1 && Math.abs(shift) > SWIPE) step(shift < 0 ? 1 : -1)
  }

  return (
    <div className={styles.stage}>
      <div className={styles.media}>
        <div className={styles.float}>
          {count === 0 ? (
            <div className={styles.placeholder}>{placeholder}</div>
          ) : (
            <button
              type="button"
              className={styles.open}
              onClick={() => setOpen(active)}
              onPointerDown={onDown}
              onPointerUp={onUp}
              aria-label={`Открыть картинку крупно: ${title}`}
            >
              {pictures.map((picture, index) => (
                <span
                  key={picture.url}
                  className={styles.slide}
                  data-state={index === active ? 'active' : index < active ? 'before' : 'after'}
                  aria-hidden={index !== active}
                >
                  <Image
                    src={picture.url}
                    alt={picture.alt || title}
                    width={picture.width}
                    height={picture.height}
                    sizes="(min-width: 1200px) 560px, (min-width: 960px) 46vw, 100vw"
                    // Первая картинка — главная на первом экране: заранее и с высоким приоритетом.
                    preload={index === 0}
                    fetchPriority={index === 0 ? 'high' : undefined}
                    draggable={false}
                    className={styles.image}
                  />
                </span>
              ))}
              <span className={styles.zoom} aria-hidden="true">
                <Maximize2 size={16} strokeWidth={1.75} />
              </span>
            </button>
          )}
        </div>
        {count > 1 && (
          <div className={styles.nav}>
            <button
              type="button"
              className={styles.arrow}
              onClick={() => step(-1)}
              aria-label="Предыдущая картинка"
            >
              <ChevronLeft size={20} strokeWidth={1.75} aria-hidden="true" />
            </button>
            <span className={styles.counter} aria-live="polite">
              {active + 1} / {count}
            </span>
            <button
              type="button"
              className={styles.arrow}
              onClick={() => step(1)}
              aria-label="Следующая картинка"
            >
              <ChevronRight size={20} strokeWidth={1.75} aria-hidden="true" />
            </button>
          </div>
        )}
      </div>
      {facts.length > 0 && (
        <dl className={styles.facts} data-count={facts.length}>
          {facts.map((fact) => (
            <div key={fact.name} className={styles.fact}>
              <dt>{fact.name}</dt>
              <dd>
                {fact.icon && <FactIcon icon={fact.icon} />}
                {fact.value}
              </dd>
            </div>
          ))}
        </dl>
      )}
      {count > 0 && (
        <PictureViewer
          title={title}
          pictures={pictures}
          index={open}
          onChange={(index) => {
            setOpen(index)
            if (index !== null) setActive(index)
          }}
        />
      )}
    </div>
  )
}

/** Значок цветности плоттера: палитра — цветная печать, полукруг — чёрно-белая. */
function FactIcon({ icon }: { icon: 'color' | 'mono' }) {
  const Icon = icon === 'color' ? Palette : Contrast
  return (
    <Icon
      className={icon === 'color' ? styles.iconColor : styles.iconMono}
      size={16}
      strokeWidth={1.75}
      aria-hidden="true"
    />
  )
}
