import styles from './ScanProgress.module.css'

/**
 * Полоска загрузки 3D-скана поверх картинки (28.10.2026): сканы в полном качестве весят
 * 5–15 МБ, на мобильном интернете это заметно — человек видит, что модель идёт.
 */
export function ScanProgress({ value }: { value: number }) {
  const percent = Math.round(value * 100)
  return (
    <div className={styles.progress} role="status">
      <span className={styles.label}>Загружаем модель в полном качестве — {percent} %</span>
      <progress className={styles.bar} max={100} value={percent} aria-hidden="true" />
    </div>
  )
}
