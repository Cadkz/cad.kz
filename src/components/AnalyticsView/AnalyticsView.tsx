import { DefaultTemplate } from '@payloadcms/next/templates'
import type { AdminViewServerProps } from 'payload'
import { AnalyticsKaddi } from '@/components/AnalyticsKaddi/AnalyticsKaddi'
import { AnalyticsTable } from '@/components/AnalyticsTable/AnalyticsTable'
import { PERIODS, periodKey, type QueryStat, SEARCH_RETENTION_DAYS } from '@/domain/searchStats.mjs'
import { loadAnalytics } from '@/lib/analytics'
import styles from './AnalyticsView.module.css'

/** Строк в таблице на странице; все — в выгрузке. */
const SHOW = 30

const percent = (part: number, whole: number) => (whole ? Math.round((part * 100) / whole) : 0)

const siteSearch = (query: string) => `/search?q=${encodeURIComponent(query)}`
const productSearch = (query: string) =>
  `/admin/collections/products?search=${encodeURIComponent(query)}`

function queryCell(query: string) {
  return (
    <a href={siteSearch(query)} target="_blank" rel="noreferrer">
      {query}
    </a>
  )
}

function targetCell(top: string | null) {
  if (!top) return '—'
  if (top === 'kaddi') return 'Спросили Кадди'
  if (top === 'whatsapp') return 'WhatsApp'
  return (
    <a href={top} target="_blank" rel="noreferrer">
      {top}
    </a>
  )
}

/**
 * «Аналитика» в админке (пожелание владельца 30.10.2026, пункт 5): что ищут на сайте, что не
 * находят (кандидаты в «Другие названия» товара) и о чём спрашивают Кадди. Период — в адресе
 * (?days=7/30/90/180), каждую таблицу можно скачать для Excel.
 */
export async function AnalyticsView({
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
  const allowed = user?.role === 'admin' || user?.role === 'editor'
  const period = periodKey(searchParams?.days)
  if (!allowed)
    return (
      <DefaultTemplate {...template}>
        <div className={styles.root}>
          <h1 className={styles.title}>Аналитика</h1>
          <p>Эта страница доступна администратору и маркетологу.</p>
        </div>
      </DefaultTemplate>
    )

  const data = await loadAnalytics(payload, period)
  const { searches } = data
  const csv = (part: string) => `/api/admin/analytics?days=${period}&part=${part}`
  const row = (stat: QueryStat) => [
    queryCell(stat.query),
    stat.count,
    stat.found,
    `${percent(stat.clicks, stat.count)} %`,
    targetCell(stat.top),
  ]

  return (
    <DefaultTemplate {...template}>
      <div className={styles.root}>
        <h1 className={styles.title}>Аналитика</h1>
        <p className={styles.lead}>
          Что ищут на сайте и о чём спрашивают Кадди. Запросы поиска хранятся{' '}
          {SEARCH_RETENTION_DAYS} дней, без адресов и имён: связать их с человеком нельзя.
        </p>
        <nav className={styles.periods} aria-label="Период">
          {Object.entries(PERIODS).map(([key, days]) => (
            <a
              key={key}
              href={`?days=${key}`}
              className={styles.period}
              aria-current={key === period ? 'page' : undefined}
            >
              {days} дней
            </a>
          ))}
        </nav>

        <dl className={styles.numbers}>
          <div>
            <dt>Поисков</dt>
            <dd>{searches.total}</dd>
          </div>
          <div>
            <dt>Разных запросов</dt>
            <dd>{searches.unique}</dd>
          </div>
          <div>
            <dt>Без результатов</dt>
            <dd>{searches.empty.length}</dd>
          </div>
          <div>
            <dt>Перешли из поиска</dt>
            <dd>{percent(searches.clicks, searches.total)} %</dd>
          </div>
          <div>
            <dt>Разговоров с Кадди</dt>
            <dd>{data.kaddi.total}</dd>
          </div>
          <div>
            <dt>Передано менеджеру</dt>
            <dd>{data.kaddi.handedOff.length}</dd>
          </div>
        </dl>
        {data.searchesCut && (
          <p className={styles.note}>
            Запросов за период очень много — в отчёте последние {searches.total}.
          </p>
        )}

        <AnalyticsTable
          id="analytics-top"
          title="Частые запросы"
          note="Нашлось — сколько подсказок или товаров показал поиск в последний раз. Переходы — как часто после запроса открывали товар, Кадди или WhatsApp."
          head={['Запрос', 'Раз', 'Нашлось', 'Переходы', 'Куда чаще']}
          rows={searches.top.slice(0, SHOW).map(row)}
          total={searches.top.length}
          csv={csv('searches')}
          empty="За этот период поиском ещё не пользовались."
        />
        <AnalyticsTable
          id="analytics-empty"
          title="Ничего не нашлось"
          note="Кандидаты в «Другие названия» товара: если товар есть, а его называют иначе (ревит, автокад, плоттер A0), откройте товар и добавьте слово во вкладке «Продвижение и поиск»."
          head={['Запрос', 'Раз', 'Что сделать']}
          rows={searches.empty.slice(0, SHOW).map((stat) => [
            queryCell(stat.query),
            stat.count,
            <a key="find" href={productSearch(stat.query)}>
              Найти товар в админке
            </a>,
          ])}
          total={searches.empty.length}
          csv={csv('empty')}
          empty="Пустых результатов нет."
        />
        <AnalyticsTable
          id="analytics-noclick"
          title="Нашлось, но не открыли"
          note="Искали не раз, поиск что-то показал, но никуда не перешли: возможно, нашлось не то."
          head={['Запрос', 'Раз', 'Нашлось', 'Переходы', 'Куда чаще']}
          rows={searches.noClick.slice(0, SHOW).map(row)}
          total={searches.noClick.length}
          empty="Таких запросов нет."
        />

        <AnalyticsKaddi
          kaddi={data.kaddi}
          cut={data.kaddiCut}
          csv={csv}
          show={SHOW}
          admin={user?.role === 'admin'}
        />
      </div>
    </DefaultTemplate>
  )
}
