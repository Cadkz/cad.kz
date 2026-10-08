import styles from './PropertyList.module.css'

/** Характеристики товара: две колонки «название — значение» от 640 px. */
export function PropertyList({ items }: { items: { name: string; value: string }[] }) {
  return (
    <dl className={styles.list}>
      {items.map((item) => (
        <div key={item.name} className={styles.row}>
          <dt className={styles.name}>{item.name}</dt>
          <dd className={styles.value}>{item.value}</dd>
        </div>
      ))}
    </dl>
  )
}
