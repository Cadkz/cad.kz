import type { ReactNode } from 'react'
import styles from './ToneBand.module.css'

export type LightTone = 'base' | 'mist' | 'lilac' | 'sky'
export type Tone = LightTone | 'night'

type Props = {
  /**
   * night — тёмный блок: свой фон во всю ширину экрана с мягко растворяющимися краями.
   * Светлые тона прозрачны: под ними общая подложка страницы (ToneBackdrop), и она плавно
   * принимает этот оттенок, когда блок проходит середину экрана.
   */
  tone: Tone
  /** Тёмный блок первым на странице: сверху без растворения, сразу под шапкой. */
  first?: boolean
  /** Декор под содержимым (изолинии первого экрана). */
  decor?: ReactNode
  children: ReactNode
}

/** Блок главной с тоном фона: чередование тёмных и светлых блоков (пробный редизайн 21.10.2026). */
export function ToneBand({ tone, first = false, decor, children }: Props) {
  const classes = [styles.band, styles[tone], first ? styles.first : '']
  return (
    <div className={classes.filter(Boolean).join(' ')} data-tone={tone}>
      {decor}
      {children}
    </div>
  )
}
