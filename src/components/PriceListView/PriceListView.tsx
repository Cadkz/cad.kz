import { DefaultTemplate } from '@payloadcms/next/templates'
import type { AdminViewServerProps } from 'payload'
import { PriceUpload } from '@/components/PriceUpload/PriceUpload'
import { formatDateTime } from '@/lib/format'
import { priceListVendors } from '@/lib/priceListRun'
import styles from './PriceListView.module.css'

type RunSnapshot = { changed?: number; file?: string }

/** Страница «Загрузить прайс» в админке: администратор и маркетолог. */
export async function PriceListView({
  initPageResult,
  params,
  searchParams,
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
  }
  const allowed = user?.role === 'admin' || user?.role === 'editor'
  const [vendors, runs] = allowed
    ? await Promise.all([
        priceListVendors(payload),
        payload.find({
          collection: 'import-runs',
          where: { idempotencyKey: { like: 'price-list:' } },
          sort: '-createdAt',
          limit: 5,
          depth: 0,
          overrideAccess: true,
        }),
      ])
    : [[], null]

  return (
    <DefaultTemplate {...template}>
      <div className={styles.root}>
        <h1 className={styles.title}>Загрузить прайс</h1>
        {allowed ? (
          <>
            <p className={styles.lead}>
              Новый прайс производителя — Excel-файл — обновляет цены всех его позиций сразу.
              Сначала сайт показывает, какая строка какому предложению досталась и какой станет цена
              в тенге. Записываются только отмеченные строки.
            </p>
            <PriceUpload vendors={vendors} />
            {runs && runs.docs.length > 0 && (
              <section className={styles.runs}>
                <h2 className={styles.subtitle}>Последние загрузки</h2>
                <ul className={styles.list}>
                  {runs.docs.map((run) => {
                    const snap = (run.snapshot ?? {}) as RunSnapshot
                    return (
                      <li key={run.id}>
                        {formatDateTime(run.createdAt)} — {snap.file || 'прайс'}, изменено цен:{' '}
                        {snap.changed ?? 0}
                      </li>
                    )
                  })}
                </ul>
              </section>
            )}
          </>
        ) : (
          <p>Эта страница доступна администратору и маркетологу.</p>
        )}
      </div>
    </DefaultTemplate>
  )
}
