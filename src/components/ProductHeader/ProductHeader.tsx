import { Badge } from '../Badge/Badge'
import { SectionIcon } from '../SectionIcon/SectionIcon'
import styles from './ProductHeader.module.css'

type Props = {
  title: string
  vendor: string | null
  summary: string | null
  icon: string | null
  tasks: string[]
  requires: string[]
}

/** Шапка страницы товара: производитель, название, коротко, задачи и зависимости от базового ПО. */
export function ProductHeader({ title, vendor, summary, icon, tasks, requires }: Props) {
  return (
    <header className={styles.header}>
      <span className={styles.icon} aria-hidden="true">
        <SectionIcon name={icon} size={24} />
      </span>
      <div className={styles.text}>
        {vendor && <p className={styles.vendor}>{vendor}</p>}
        <h1>{title}</h1>
        {summary && <p className={styles.summary}>{summary}</p>}
        {requires.length > 0 && (
          <p className={styles.requires}>
            Работает с базовым ПО: {requires.join(', ')}. Его нужно приобрести отдельно.
          </p>
        )}
        {tasks.length > 0 && (
          <ul className={styles.tasks} aria-label="Задачи">
            {tasks.map((task) => (
              <li key={task}>
                <Badge>{task}</Badge>
              </li>
            ))}
          </ul>
        )}
      </div>
    </header>
  )
}
