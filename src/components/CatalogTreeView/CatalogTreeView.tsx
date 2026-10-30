import { DefaultTemplate } from '@payloadcms/next/templates'
import type { AdminViewServerProps } from 'payload'
import { AdminTabs } from '@/components/AdminTabs/AdminTabs'
import { CatalogTree } from '@/components/CatalogTree/CatalogTree'
import { loadCatalogTree } from '@/lib/adminCatalog'
import styles from './CatalogTreeView.module.css'

/** Страница «Каталог» в админке, деревом как в Битриксе: администратор и маркетолог. */
export async function CatalogTreeView({
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
  const data = allowed ? await loadCatalogTree(payload) : null

  return (
    <DefaultTemplate {...template}>
      <div className={styles.root}>
        <h1 className={styles.title}>Каталог</h1>
        <AdminTabs set="catalog" current="/admin/catalog" />
        {data ? (
          <>
            <p className={styles.lead}>
              Как в Битриксе: вкладка → производитель → товары. «Сорт.» и «Активность» меняются
              прямо в строке и сохраняются сразу. Меньше «Сорт.» — выше на сайте: у производителя —
              порядок плиток производителей, у товара — порядок среди товаров производителя. Топы
              продаж («Топ») всё равно идут первыми во всём каталоге.
            </p>
            <CatalogTree data={data} />
          </>
        ) : (
          <p>Эта страница доступна администратору и маркетологу.</p>
        )}
      </div>
    </DefaultTemplate>
  )
}
