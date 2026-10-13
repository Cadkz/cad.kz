import styles from './Aurora.module.css'

type Props = {
  className?: string
}

/**
 * Сияние — медленный перелив голубого и сине-фиолетового внутри тёмного баннера (баннер
 * обрезает его краями). Только CSS, без картинок и JavaScript; при prefers-reduced-motion
 * стоит на месте. Родитель задаёт position: relative, isolation: isolate и overflow — слой
 * ложится под его содержимое. Свечения вокруг блоков (под баннером, в подвале, за секциями)
 * убраны по решению владельца 13.10.2026.
 */
export function Aurora({ className }: Props) {
  const classes = [styles.aurora, className]
  return <span className={classes.filter(Boolean).join(' ')} aria-hidden="true" />
}
