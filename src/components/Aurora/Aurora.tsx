import styles from './Aurora.module.css'

type Props = {
  /**
   * glow — перелив внутри тёмного баннера (баннер обрезает его краями);
   * halo — цветное свечение под тёмным баннером, как тень за карточкой;
   * floor — пастельное сияние снизу светлого блока (подвал).
   */
  variant: 'glow' | 'halo' | 'floor'
  /** Свечение разгорается, когда блок входит в экран (для блоков ниже первого экрана). */
  onScroll?: boolean
  className?: string
}

const variants = { glow: styles.glow, halo: styles.halo, floor: styles.floor }

/**
 * Сияние — декоративный слой из мягких пятен синего, голубого и сине-фиолетового, которые
 * медленно переливаются. Только CSS, без картинок и JavaScript; при prefers-reduced-motion
 * стоит на месте. Родитель задаёт position: relative и isolation: isolate — слой ложится
 * под его содержимое.
 */
export function Aurora({ variant, onScroll = false, className }: Props) {
  const classes = [styles.aurora, variants[variant], onScroll && styles.onScroll, className]
  return <span className={classes.filter(Boolean).join(' ')} aria-hidden="true" />
}
