import { CalendarDays } from 'lucide-react'
import { type CourseGroup, groupBrief } from '@/domain/courseSchedule.mjs'
import { plural } from '@/lib/plural'
import styles from './CourseGroups.module.css'

/** Сколько ближайших групп показывать: дальше — «ещё N» строкой. */
const SHOWN = 4

/**
 * Ближайшие группы курса из расписания учебного центра (Google Таблица, src/lib/courseSchedule.ts):
 * даты, дни, время, формат, преподаватель. Записаться — кнопкой в карточке покупки.
 */
export function CourseGroups({ groups, today }: { groups: CourseGroup[]; today: string }) {
  if (!groups.length) return null
  const shown = groups.slice(0, SHOWN)
  const rest = groups.length - shown.length
  return (
    <div className={styles.root}>
      <ul className={styles.list}>
        {shown.map((group) => {
          const brief = groupBrief(group, today)
          const meta = [
            brief.days
              ? `${brief.days} ${plural(brief.days, 'занятие', 'занятия', 'занятий')}`
              : '',
            brief.time,
            brief.format,
          ].filter(Boolean)
          return (
            <li key={group.code || group.start} className={styles.group}>
              <CalendarDays className={styles.icon} size={20} strokeWidth={1.75} aria-hidden />
              <span className={styles.text}>
                <strong className={styles.dates}>{brief.dates}</strong>
                <span className={styles.meta}>{meta.join(' · ')}</span>
                {brief.teacher && (
                  <span className={styles.meta}>Преподаватель: {brief.teacher}</span>
                )}
              </span>
            </li>
          )
        })}
      </ul>
      <p className={styles.note}>
        {rest > 0 ? `И ещё ${rest} ${plural(rest, 'группа', 'группы', 'групп')} позже. ` : ''}
        Расписание ведёт учебный центр; место в группе подтвердит менеджер.
      </p>
    </div>
  )
}
