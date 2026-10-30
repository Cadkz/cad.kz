import { DefaultTemplate } from '@payloadcms/next/templates'
import type { AdminViewServerProps } from 'payload'
import { AdminTabs } from '@/components/AdminTabs/AdminTabs'
import { RatesForm } from '@/components/RatesForm/RatesForm'
import { loadRates } from '@/lib/ratesRun'
import styles from './RatesView.module.css'

/** Страница «Курсы валют» в админке: все курсы и НДС на одном экране. */
export async function RatesView({
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
    // Кнопки в шапке (поиск, тема) — общие для всех страниц админки, см. admin.components.actions.
    viewActions,
  }
  const allowed = user?.role === 'admin' || user?.role === 'editor'
  const data = allowed ? await loadRates(payload) : null

  return (
    <DefaultTemplate {...template}>
      <div className={styles.root}>
        <h1 className={styles.title}>Курсы валют</h1>
        <AdminTabs set="prices" current="/admin/rates" />
        {data ? (
          <>
            <p className={styles.lead}>
              От курса считаются цены всех предложений в этой валюте. Впишите новый курс у нужных
              валют и дату, с которой он действует, — сайт покажет, как изменятся цены, и только
              после этого запишет. Прошлые курсы не правятся: у каждой рассчитанной цены остаётся
              свой курс.
            </p>
            <p className={styles.note}>
              НДС в ценах на сайте — {data.vat} %.{' '}
              {user?.role === 'admin' ? (
                <>
                  <a href="/admin/globals/pricing-settings">Изменить ставку</a>.
                </>
              ) : (
                'Меняет администратор.'
              )}{' '}
              Все записи курсов — <a href="/admin/collections/exchange-rates">списком</a>, кто и
              когда менял — <a href="/admin/collections/activity-log">журнал действий</a>.
            </p>
            <RatesForm cards={data.cards} />
          </>
        ) : (
          <p>Эта страница доступна администратору и маркетологу.</p>
        )}
      </div>
    </DefaultTemplate>
  )
}
