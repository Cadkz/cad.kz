import { DefaultTemplate } from '@payloadcms/next/templates'
import type { AdminViewServerProps } from 'payload'
import { AnalyticsTable } from '@/components/AnalyticsTable/AnalyticsTable'
import { CoursesActions } from '@/components/CoursesActions/CoursesActions'
import {
  type CourseGroup,
  periodText,
  scheduleEditUrl,
  scheduleReport,
} from '@/domain/courseSchedule.mjs'
import { getCatalog } from '@/lib/catalog'
import { courseMatches } from '@/lib/courseSchedule'
import { formatDateTime, formatKzt } from '@/lib/format'
import styles from './CoursesView.module.css'
import { siteKzt } from './siteKzt'

const when = (group: CourseGroup | null, today: string) =>
  group ? periodText(group, today) : 'групп с открытым набором нет'

/**
 * «Расписание курсов» в админке (просьба владельца 30.10.2026): сверка курсов сайта с Google
 * Таблицей учебного центра — что есть везде, чего нет на сайте, что на сайте лишнее, где цена
 * расходится. Лишние можно скрыть, цены — взять из таблицы (CoursesActions).
 */
export async function CoursesView({
  initPageResult,
  params,
  searchParams,
  viewActions,
}: AdminViewServerProps) {
  const { req, visibleEntities, permissions, locale } = initPageResult
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

  const fresh = searchParams?.fresh === '1'
  const [matches, catalog] = await Promise.all([courseMatches(payload, { fresh }), getCatalog()])
  const { schedule, today } = matches
  const report = scheduleReport(matches.programs, matches.courses, today)
  const listed = new Map(catalog.items.map((item) => [item.href, item.priceFrom]))
  const edit = (id: number) => `/admin/collections/products/${id}`
  const diff = report.linked.filter(
    (row) => row.price && listed.get(row.course.href) !== formatKzt(siteKzt(row.price)),
  )

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
          курса, в «С этим покупают» у программы и у Кадди. Таблица читается раз в 10 минут.
        </p>
        <p className={schedule.error ? styles.error : styles.note}>
          {schedule.fetchedAt
            ? `Прочитана ${formatDateTime(schedule.fetchedAt)}, запусков: ${schedule.groups.length}.`
            : 'Таблица ещё ни разу не прочиталась.'}{' '}
          {schedule.error ? `Сейчас не читается: ${schedule.error}.` : ''}{' '}
          <a href="?fresh=1">Прочитать сейчас</a>
        </p>
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
          note="Есть в таблице, на сайте не нашлись. Добавить курс: «Каталог» → «Услуги и обучение» → + Товар с типом «Курс»; или впишите название в «Другие названия» похожего курса."
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
          prices={diff.map((row) => ({
            id: row.course.id,
            title: row.course.title,
            site: listed.get(row.course.href) ?? 'по запросу',
            table: row.price ? formatKzt(siteKzt(row.price)) : '',
          }))}
          ready={Boolean(schedule.fetchedAt)}
        />
      </div>
    </DefaultTemplate>
  )
}
