import type { ReactNode } from 'react'
import styles from './ToneBand.module.css'

type LightTone = 'base' | 'mist' | 'lilac' | 'sky'
export type Tone = LightTone | 'night'

type Props = {
  /**
   * night — тёмная панель во всю ширину экрана, разворачивается из карточки при прокрутке.
   * Светлые тона — свой фон во всю ширину; голубой и сиреневый плавно меняют оттенок, пока
   * блок проходит экран.
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
