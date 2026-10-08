import { DefaultTemplate } from '@payloadcms/next/templates'
import type { AdminViewServerProps } from 'payload'
import { BitrixImport } from '@/components/BitrixImport/BitrixImport'
import { formatDateTime } from '@/lib/format'
import styles from './BitrixImportView.module.css'

const STATES: Record<string, string> = {
  running: 'не закончен',
  done: 'записан',
  failed: 'остановлен ошибкой',
}

/** Страница «Импорт из Битрикса» в админке. Открывает только администратор. */
export async function BitrixImportView({
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

  if (user?.role !== 'admin')
    return (
      <DefaultTemplate {...template}>
        <div className={styles.root}>
          <h1 className={styles.title}>Импорт из Битрикса</h1>
          <p>Эта страница доступна только администратору.</p>
        </div>
      </DefaultTemplate>
    )

  const runs = await payload.find({
    collection: 'import-runs',
    sort: '-createdAt',
    limit: 5,
    depth: 0,
    user,
    overrideAccess: false,
  })

  return (
    <DefaultTemplate {...template}>
      <div className={styles.root}>
        <h1 className={styles.title}>Импорт из Битрикса</h1>
        <p className={styles.lead}>
          Перенос каталога со старого cad.kz: товары, варианты с ценами, производители и картинки.
          Файлы читаются прямо в браузере и никуда не загружаются, на сайт уходят только записи
          каталога. Повторный импорт безопасен: обновляет изменившееся и ничего не удаляет.
        </p>
        <BitrixImport />
        {runs.docs.length > 0 && (
          <section className={styles.runs}>
            <h2 className={styles.subtitle}>Последние запуски</h2>
            <ul className={styles.list}>
              {runs.docs.map((run) => (
                <li key={run.id}>
                  <a href={`/admin/collections/import-runs/${run.id}`}>
                    {formatDateTime(run.createdAt)}
                  </a>{' '}
                  — {STATES[run.state] ?? run.state}
                </li>
              ))}
            </ul>
          </section>
        )}
      </div>
    </DefaultTemplate>
  )
}
