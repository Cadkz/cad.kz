'use client'

import { ChevronLeft, ChevronRight, Contrast, Maximize2, Palette } from 'lucide-react'
import Image from 'next/image'
import { type PointerEvent, type ReactNode, useRef, useState } from 'react'
import { useT } from '@/components/LangProvider/LangProvider'
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
  /** Логотип программы или производителя: на листе вместо значка, если картинок нет. */
  logo?: { url: string; width: number; height: number } | null
}

/** Сдвиг пальцем, после которого лента листается. */
const SWIPE = 40

/**
 * Сцена первого экрана любого товара (решение владельца 24.10.2026): голубой лист с разметкой,
 * картинки листаются стрелками и пальцем — уходят вбок в размытие, новая выплывает из него;
 * нажатие открывает картинку крупно (PictureViewer). Под картинкой — главные факты строкой (27.10.2026), у плоттеров пять, цветность со значком (30.10.2026). При прокрутке
 * фото отстаёт от сетки листа — глубина без JavaScript (CSS).
 */
export function ProductStage({ title, pictures, facts, placeholder, logo }: Props) {
  const t = useT()
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
            <div className={styles.placeholder}>
              {logo ? (
                <span className={styles.logo}>
                  <Image
                    src={logo.url}
                    width={logo.width}
                    height={logo.height}
                    alt={title}
                    unoptimized
                  />
                </span>
              ) : (
                placeholder
              )}
            </div>
          ) : (
            <button
              type="button"
              className={styles.open}
              onClick={() => setOpen(active)}
              onPointerDown={onDown}
              onPointerUp={onUp}
              aria-label={t('Открыть картинку крупно: {name}', { name: title })}
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
              aria-label={t('Предыдущая картинка')}
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
              aria-label={t('Следующая картинка')}
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
              <dt>{t(fact.name)}</dt>
              <dd>
                {fact.icon && <FactIcon icon={fact.icon} />}
                {t(fact.value)}
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
