import type { SyncReport } from '@/lib/courseSync'
import { formatDateTime, formatKzt } from '@/lib/format'
import { siteKzt } from '../CoursesView/siteKzt'
import styles from './CourseSyncNote.module.css'

type Props = { sync: SyncReport | null; edit: (id: number) => string }

const price = (amount: string | null) => (amount ? formatKzt(siteKzt(amount)) : 'без цены')

/**
 * Что сайт в последний раз поменял сам по таблице УЦ (src/lib/courseSync.ts): цены курсов,
 * заведённые курсы, курсы с несколькими комплектациями, которые не тронуты.
 */
export function CourseSyncNote({ sync, edit }: Props) {
  if (!sync)
    return (
      <p className={styles.note}>
        По таблице сайт пока ничего не менял: цены совпадают, новых курсов нет.
      </p>
    )
  return (
    <section className={styles.box} aria-labelledby="courses-sync">
      <p id="courses-sync" className={styles.title}>
        <strong>Последние изменения по таблице — {formatDateTime(sync.at)}</strong>
      </p>
      {sync.prices.length > 0 && (
        <p className={styles.line}>
          Цены ({sync.prices.length}):{' '}
          {sync.prices
            .map((row) => `${row.title} — ${price(row.before)} → ${price(row.amount)}`)
            .join('; ')}
          .
        </p>
      )}
      {sync.created.length > 0 && (
        <p className={styles.line}>
          Заведены курсы ({sync.created.length}):{' '}
          {sync.created.map((course, index) => (
            <span key={course.id}>
              {index > 0 && '; '}
              <a href={edit(course.id)}>{course.title}</a>
            </span>
          ))}
          . Описание — кнопкой «Обновить описания» ниже.
        </p>
      )}
      {sync.skipped.length > 0 && (
        <p className={styles.line}>
          Цена не тронута — у курса несколько комплектаций, правьте в «Ценах»:{' '}
          {sync.skipped.join('; ')}.
        </p>
      )}
      {sync.errors.length > 0 && (
        <p className={styles.error}>Не получилось: {sync.errors.join('; ')}.</p>
      )}
    </section>
  )
}
