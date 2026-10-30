import { DefaultTemplate } from '@payloadcms/next/templates'
import type { AdminViewServerProps } from 'payload'
import { AdminTabs } from '@/components/AdminTabs/AdminTabs'
import { PriceGrid } from '@/components/PriceGrid/PriceGrid'
import { loadPriceGrid } from '@/lib/offerPrices'
import styles from './PricesView.module.css'

/** Страница «Цены таблицей» в админке: администратор и маркетолог. */
export async function PricesView({
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
  const data = allowed ? await loadPriceGrid(payload) : null
  // ?q=… — ссылка «Цены таблицей» из карточки товара открывает таблицу уже с поиском по товару.
  const query = typeof searchParams?.q === 'string' ? searchParams.q.slice(0, 200) : ''

  return (
    <DefaultTemplate {...template}>
      <div className={styles.root}>
        <h1 className={styles.title}>Цены</h1>
        <AdminTabs set="prices" current="/admin/prices" />
        {data ? (
          <>
            <p className={styles.lead}>
              Как в «Каталоге»: вкладка → производитель → товары с комплектациями. Поиск и фильтры
              сразу показывают таблицу по всей вкладке. Впишите новую цену прямо в таблицу — справа
              видно, какой она станет на сайте. Ничего не меняется, пока вы не проверите сводку и не
              нажмёте «Применить».
            </p>
            <p className={styles.note}>
              Цена на сайте = цена в валюте × курс + НДС {data.vat} %, вниз до тысячи тенге. Курсы:{' '}
              {data.rates.map((rate) => `${rate.currency} ${rate.value} ₸`).join(', ') ||
                'не заданы'}{' '}
              — <a href="/admin/rates">курсы одной страницей</a>.
            </p>
            <PriceGrid data={data} query={query} />
          </>
        ) : (
          <p>Эта страница доступна администратору и маркетологу.</p>
        )}
      </div>
    </DefaultTemplate>
  )
}
