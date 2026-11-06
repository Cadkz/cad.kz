import type { ReactNode } from 'react'
import { getT } from '@/i18n/server'
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
  /** Сцена с крупным фото под заголовком (оборудование с фото, пробная ветка 23.10.2026). */
  media?: ReactNode
}

/**
 * Шапка страницы товара: производитель, название, коротко, задачи и зависимости от базового ПО.
 * У оборудования с фото под текстом — крупная сцена с фото и главными фактами.
 */
export async function ProductHeader({
  title,
  vendor,
  summary,
  icon,
  tasks,
  requires,
  media,
}: Props) {
  const t = await getT()
  return (
    <header className={styles.header}>
      <div className={styles.top}>
        {icon && (
          <span className={styles.icon} aria-hidden="true">
            <SectionIcon name={icon} size={80} />
          </span>
        )}
        <div className={styles.text}>
          {vendor && <p className={styles.vendor}>{vendor}</p>}
          <h1>{title}</h1>
          {summary && <p className={styles.summary}>{summary}</p>}
          {requires.length > 0 && (
            <p className={styles.requires}>
              {t('Работает с базовым ПО: {list}. Его нужно приобрести отдельно.', {
                list: requires.join(', '),
              })}
            </p>
          )}
          {tasks.length > 0 && (
            <ul className={styles.tasks} aria-label={t('Задачи')}>
              {tasks.map((task) => (
                <li key={task}>
                  <Badge>{task}</Badge>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
      {media}
    </header>
  )
}
