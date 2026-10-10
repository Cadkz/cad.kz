'use client'

import { ChevronLeft, ChevronRight } from 'lucide-react'
import Link from 'next/link'
import { useEffect, useState } from 'react'
import type { Slide } from '@/lib/home'
import { BannerArt } from '../BannerArt/BannerArt'
import styles from './HeroSlider.module.css'

const INTERVAL = 4000

/**
 * Баннер с акциями из CMS. Листается стрелками и точками; автопрокрутка останавливается
 * при наведении и фокусе и отключена при prefers-reduced-motion.
 */
export function HeroSlider({ slides }: { slides: Slide[] }) {
  const [index, setIndex] = useState(0)
  const [paused, setPaused] = useState(false)
  const count = slides.length

  useEffect(() => {
    if (paused || count < 2) return
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    const timer = setInterval(() => setIndex((i) => (i + 1) % count), INTERVAL)
    return () => clearInterval(timer)
  }, [paused, count])

  const slide = slides[index]
  if (!slide) return null
  const go = (next: number) => setIndex((next + count) % count)

  return (
    <section
      className={styles.slider}
      aria-roledescription="карусель"
      aria-label="Акции и новинки"
      onPointerEnter={() => setPaused(true)}
      onPointerLeave={() => setPaused(false)}
      onFocus={() => setPaused(true)}
      onBlur={() => setPaused(false)}
    >
      <BannerArt name="tag" className={styles.art} />
      <div key={index} className={styles.content} aria-live={paused ? 'polite' : 'off'}>
        <p className={styles.title}>{slide.title}</p>
        {slide.text && <p className={styles.text}>{slide.text}</p>}
        <Link href={slide.href} className={styles.cta}>
          Подробнее
        </Link>
      </div>
      {count > 1 && (
        <div className={styles.controls}>
          <button
            type="button"
            className={styles.arrow}
            onClick={() => go(index - 1)}
            aria-label="Предыдущий слайд"
          >
            <ChevronLeft size={20} strokeWidth={1.75} aria-hidden="true" />
          </button>
          <div className={styles.dots}>
            {slides.map((item, i) => (
              <button
                key={item.href}
                type="button"
                className={styles.dot}
                aria-current={i === index}
                aria-label={`Слайд ${i + 1} из ${count}`}
                onClick={() => go(i)}
              />
            ))}
          </div>
          <button
            type="button"
            className={styles.arrow}
            onClick={() => go(index + 1)}
            aria-label="Следующий слайд"
          >
            <ChevronRight size={20} strokeWidth={1.75} aria-hidden="true" />
          </button>
        </div>
      )}
    </section>
  )
}
