import styles from './ImportProgress.module.css'

/** Полоса прогресса шага импорта: что делается и сколько из скольких. */
export function ImportProgress({
  label,
  done,
  total,
}: {
  label: string
  done: number
  total: number
}) {
  const percent = total ? Math.min(100, Math.round((done / total) * 100)) : 0
  return (
    <div className={styles.root}>
      <div className={styles.text}>
        <span>{label}</span>
        <span>
          {done} из {total} · {percent}%
        </span>
      </div>
      <progress className={styles.bar} value={done} max={total || 1} aria-label={label} />
    </div>
  )
}
