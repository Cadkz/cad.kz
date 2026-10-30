import { DefaultTemplate } from '@payloadcms/next/templates'
import type { AdminViewServerProps } from 'payload'
import { AnalyticsTable } from '@/components/AnalyticsTable/AnalyticsTable'
import { CourseSyncNote } from '@/components/CourseSyncNote/CourseSyncNote'
import { CoursesActions, CoursesRead } from '@/components/CoursesActions/CoursesActions'
import {
  type CourseGroup,
  periodText,
  scheduleEditUrl,
  scheduleReport,
} from '@/domain/courseSchedule.mjs'
import { requireLogin } from '@/lib/adminGate'
import { getCatalog } from '@/lib/catalog'
import { courseLinks } from '@/lib/coursePages'
import { courseMatches } from '@/lib/courseSchedule'
import { lastSync } from '@/lib/courseSync'
import { formatDateTime, formatKzt } from '@/lib/format'
import styles from './CoursesView.module.css'
import { siteKzt } from './siteKzt'

const when = (group: CourseGroup | null, today: string) =>
  group ? periodText(group, today) : 'групп с открытым набором нет'

/**
 * «Расписание курсов» в админке (просьба владельца 30.10.2026): сверка курсов сайта с Google
 * Таблицей учебного центра — что есть везде, чего нет на сайте, что на сайте лишнее. Цены и новые
 * курсы сайт берёт из таблицы сам при каждом чтении (src/lib/courseSync.ts) — здесь отчёт о
 * последних изменениях. Лишние можно скрыть, описания — обновить с l-p.kz (CoursesActions).
 */
export async function CoursesView({
  initPageResult,
  params,
  searchParams,
  viewActions,
}: AdminViewServerProps) {
  const { req, visibleEntities, permissions, locale } = initPageResult
  requireLogin(req)
  const { payload, user, i18n } = req
  const template = {
    i18n,
    locale,
    params,
    payload,
    permissions,
    searchParams,
    user: user ?? undefined,
    visibleEntities,
    viewActions,
  }
  if (user?.role !== 'admin' && user?.role !== 'editor')
    return (
      <DefaultTemplate {...template}>
        <div className={styles.root}>
          <h1>Расписание курсов</h1>
          <p>Эта страница доступна администратору и маркетологу.</p>
        </div>
      </DefaultTemplate>
    )

  const matches = await courseMatches(payload, { fresh: true })
  const [catalog, sync] = await Promise.all([getCatalog(), lastSync(payload)])
  const { schedule, today } = matches
  const report = scheduleReport(matches.programs, matches.courses, today)
  const listed = new Map(catalog.items.map((item) => [item.href, item.priceFrom]))
  const edit = (id: number) => `/admin/collections/products/${id}`
  const links = courseLinks(matches)

  return (
    <DefaultTemplate {...template}>
      <div className={styles.root}>
        <h1 className={styles.title}>Расписание курсов</h1>
        <p className={styles.lead}>
          Курсы на сайте сверяются с{' '}
          <a
            href={scheduleEditUrl(process.env.COURSE_SCHEDULE_URL)}
            target="_blank"
            rel="noreferrer"
          >
            Google Таблицей учебного центра
          </a>
          . Её ведёт администратор УЦ: даты, отмены и переносы сайт берёт оттуда сам — на странице
          курса, в каталоге, в «С этим покупают» у программы и у Кадди. Таблица читается раз в сутки
          ночью (02:37 по Астане) и по кнопке «Прочитать сейчас», и каждый раз сайт сам ставит
          курсам цены из таблицы (на сайте — вниз до тысячи) и заводит курсы, которых на сайте ещё
          нет.
        </p>
        <p className={schedule.error ? styles.error : styles.note}>
          {schedule.fetchedAt
            ? `Прочитана ${formatDateTime(schedule.fetchedAt)}, запусков: ${schedule.groups.length}.`
            : 'Таблица ещё ни разу не прочиталась — нажмите «Прочитать сейчас».'}{' '}
          {schedule.error ? `Сейчас не читается: ${schedule.error}.` : ''}
        </p>
        <CoursesRead />
        <CourseSyncNote sync={sync} edit={edit} />
        <p className={styles.note}>
          Курс на сайте называется иначе, чем в таблице? Откройте курс и впишите название из таблицы
          в «Другие названия для поиска» (вкладка «Продвижение и поиск») — сверка его узнает.
        </p>

        <AnalyticsTable
          id="courses-linked"
          title={`Есть на сайте и в расписании: ${report.linked.length}`}
          head={['Курс на сайте', 'Ближайшая группа', 'Цена на сайте', 'Цена в таблице']}
          rows={report.linked.map((row) => [
            <a key="c" href={edit(row.course.id)}>
              {row.course.title}
            </a>,
            when(row.next, today),
            listed.get(row.course.href) ?? 'по запросу',
            row.price ? formatKzt(siteKzt(row.price)) : '—',
          ])}
          empty="Ни один курс сайта не нашёлся в таблице."
        />
        <AnalyticsTable
          id="courses-missing"
          title={`Нет на сайте: ${report.missing.length}`}
          note="Есть в таблице, на сайте не нашлись и сами не завелись: нет ссылки на l-p.kz в колонке «Программа курса», нет будущих запусков или курс скрыт на сайте. Поправьте строку в таблице или впишите название в «Другие названия» похожего курса."
          head={['Курс в таблице', 'Ближайшая группа', 'Цена', 'Программа']}
          rows={report.missing.map(({ program, next }) => [
            program.title,
            when(next, today),
            program.price ? formatKzt(siteKzt(program.price)) : '—',
            program.link ? (
              <a key="l" href={program.link} target="_blank" rel="noreferrer">
                l-p.kz
              </a>
            ) : (
              '—'
            ),
          ])}
          empty="Все курсы таблицы есть на сайте."
        />
        <CoursesActions
          extra={report.extra.map((course) => ({ id: course.id, title: course.title }))}
          pages={report.linked.flatMap((row) => {
            const link = links.get(row.course.id)
            return link ? [{ id: row.course.id, title: row.course.title, link }] : []
          })}
          ready={Boolean(schedule.fetchedAt)}
        />
      </div>
    </DefaultTemplate>
  )
}
