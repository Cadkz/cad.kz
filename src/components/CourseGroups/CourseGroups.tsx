import { CalendarDays } from 'lucide-react'
import { type CourseGroup, groupBrief } from '@/domain/courseSchedule.mjs'
import { getT } from '@/i18n/server'
import styles from './CourseGroups.module.css'

/** Сколько ближайших групп показывать: дальше — «ещё N» строкой. */
const SHOWN = 4

/**
 * Ближайшие группы курса из расписания учебного центра (Google Таблица, src/lib/courseSchedule.ts):
 * даты, дни, время, формат, преподаватель. Записаться — кнопкой в карточке покупки.
 */
export async function CourseGroups({ groups, today }: { groups: CourseGroup[]; today: string }) {
  const t = await getT()
  if (!groups.length) return null
  const shown = groups.slice(0, SHOWN)
  const rest = groups.length - shown.length
  return (
    <div className={styles.root}>
      <ul className={styles.list}>
        {shown.map((group) => {
          const brief = groupBrief(group, today, t.lang)
          const meta = [
            brief.days
              ? `${brief.days} ${t.plural(brief.days, 'занятие', 'занятия', 'занятий')}`
              : '',
            brief.time,
            t(brief.format),
          ].filter(Boolean)
          return (
            <li key={group.code || group.start} className={styles.group}>
              <CalendarDays className={styles.icon} size={20} strokeWidth={1.75} aria-hidden />
              <span className={styles.text}>
                <strong className={styles.dates}>{brief.dates}</strong>
                <span className={styles.meta}>{meta.join(' · ')}</span>
                {brief.teacher && (
                  <span className={styles.meta}>
                    {t('Преподаватель: {name}', { name: brief.teacher })}
                  </span>
                )}
              </span>
            </li>
          )
        })}
      </ul>
      <p className={styles.note}>
        {rest > 0
          ? `${t('И ещё {count} {word} позже.', { count: rest, word: t.plural(rest, 'группа', 'группы', 'групп') })} `
          : ''}
        {t('Расписание ведёт учебный центр; место в группе подтвердит менеджер.')}
      </p>
    </div>
  )
}
