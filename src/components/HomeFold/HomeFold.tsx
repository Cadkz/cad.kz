'use client'

import { ChevronDown, ChevronUp } from 'lucide-react'
import { type ReactNode, useEffect, useRef, useState } from 'react'
import { Button } from '../Button/Button'
import { useT } from '../LangProvider/LangProvider'
import styles from './HomeFold.module.css'

/**
 * Каталог на главной свёрнут до --home-catalog-height (1000 px, правка владельца 02.11.2026,
 * вечер): низ плавно уходит в белый, по центру «Раскрыть каталог». Раскрытый — целиком, со
 * страницами, внизу «Свернуть каталог». Каталог короче предела — без кнопок.
 */
export function HomeFold({ children }: { children: ReactNode }) {
  const t = useT()
  const [open, setOpen] = useState(false)
  const [tall, setTall] = useState(false)
  const box = useRef<HTMLDivElement>(null)
  const inner = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const el = box.current
    const content = inner.current
    if (!el || !content) return
    // Предел — из того же токена, что ограничивает блок в CSS.
    const measure = () => {
      const limit = Number.parseFloat(
        getComputedStyle(el).getPropertyValue('--home-catalog-height'),
      )
      setTall(content.offsetHeight > limit + 1)
    }
    measure()
    const observer = new ResizeObserver(measure)
    observer.observe(content)
    observer.observe(el)
    return () => observer.disconnect()
  }, [])

  const close = () => {
    setOpen(false)
    box.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  return (
    <div className={styles.root}>
      <div ref={box} className={styles.box} data-open={open ? 'true' : undefined}>
        <div ref={inner}>{children}</div>
        {tall && !open && (
          <div className={styles.fade}>
            <Button onClick={() => setOpen(true)} aria-expanded={false}>
              {t('Раскрыть каталог')}
              <ChevronDown size={16} strokeWidth={1.75} aria-hidden="true" />
            </Button>
          </div>
        )}
      </div>
      {open && tall && (
        <div className={styles.less}>
          <Button variant="outline" onClick={close} aria-expanded>
            {t('Свернуть каталог')}
            <ChevronUp size={16} strokeWidth={1.75} aria-hidden="true" />
          </Button>
        </div>
      )}
    </div>
  )
}
