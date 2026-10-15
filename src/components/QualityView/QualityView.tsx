import { DefaultTemplate } from '@payloadcms/next/templates'
import type { AdminViewServerProps } from 'payload'
import { AdminCardGrid } from '@/components/AdminCardGrid/AdminCardGrid'
import { listHref } from '@/domain/adminLinks.mjs'
import { loadQualityReport } from '@/lib/qualityReport'
import styles from './QualityView.module.css'

const notFull = listHref('products', [
  { status: { equals: 'published' } },
  { qualityScore: { less_than: 100 } },
])

/** «Контроль качества» в админке: что не заполнено на сайте, по разделам. */
export async function QualityView({ initPageResult, params, searchParams }: AdminViewServerProps) {
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
  }
  const allowed = user?.role === 'admin' || user?.role === 'editor'
  const report = allowed ? await loadQualityReport(payload) : null

  return (
    <DefaultTemplate {...template}>
      <div className={styles.root}>
        <h1 className={styles.title}>Контроль качества</h1>
        {report ? (
          <>
            <p className={styles.lead}>
              Что не заполнено у того, что видит покупатель. Нажмите на название, чтобы открыть
              запись, или «Все в списке» — откроется список с готовым фильтром.
            </p>
            <p className={styles.summary}>
              Товаров на сайте: <strong>{report.summary.products}</strong>, заполнены полностью:{' '}
              <strong>{report.summary.full}</strong>, в среднем{' '}
              <strong>{report.summary.average} %</strong>.{' '}
              <a href={notFull}>Все неполные в списке товаров</a>
            </p>
            {report.sections.map((section) => (
              <section
                key={section.key}
                className={styles.section}
                aria-labelledby={`quality-${section.key}`}
              >
                <h2 className={styles.heading} id={`quality-${section.key}`}>
                  {section.title}
                </h2>
                <p className={styles.note}>{section.lead}</p>
                <AdminCardGrid cards={section.cards} />
              </section>
            ))}
          </>
        ) : (
          <p>Эта страница доступна администратору и маркетологу.</p>
        )}
      </div>
    </DefaultTemplate>
  )
}
