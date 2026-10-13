import { DefaultTemplate } from '@payloadcms/next/templates'
import type { AdminViewServerProps } from 'payload'
import { YukiData } from '@/components/YukiData/YukiData'
import { YukiPriceSearch } from '@/components/YukiPriceSearch/YukiPriceSearch'
import { knowledgeCount, priceSummary } from '@/lib/assistant/priceTable'
import { formatDateTime, formatDay } from '@/lib/format'
import styles from './YukiDataView.module.css'

const VAT = { included: 'с НДС', excluded: 'без НДС', unknown: 'НДС не указан' } as const

/** Страница «Прайс и база Юки» в админке: администратор и маркетолог. */
export async function YukiDataView({ initPageResult, params, searchParams }: AdminViewServerProps) {
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
  const [price, knowledge] = allowed
    ? await Promise.all([priceSummary(payload), knowledgeCount(payload)])
    : [null, { all: 0, active: 0 }]

  return (
    <DefaultTemplate {...template}>
      <div className={styles.root}>
        <h1 className={styles.title}>Прайс и база Юки</h1>
        {allowed ? (
          <>
            <p className={styles.lead}>
              Отсюда Юки берёт цены и справку. Загрузите Excel «Прайс CAD.kz»: лист
              product_price_list — прайс, лист FAQ — база знаний. Файл читается в браузере и
              хранится только в базе сайта, клиентам не отправляется. Новый прайс полностью заменяет
              прежний.
            </p>
            <div className={styles.state}>
              {price ? (
                <p>
                  Прайс: <strong>{price.rows.toLocaleString('ru-RU')} строк</strong>, дата прайса{' '}
                  {price.updated ? formatDay(price.updated) : 'не указана'}, {VAT[price.vat]}.
                  Загружен {formatDateTime(price.uploadedAt)} ({price.uploadedBy}), файл «
                  {price.fileName}».
                </p>
              ) : (
                <p className={styles.warn}>
                  Прайс не загружен — Юки не называет цены и передаёт вопросы о стоимости менеджеру.
                </p>
              )}
              <p>
                База знаний: {knowledge.active} записей включено из {knowledge.all}.{' '}
                <a href="/admin/collections/assistant-knowledge">Открыть и поправить</a>
              </p>
            </div>
            <YukiData />
            {price && <YukiPriceSearch />}
          </>
        ) : (
          <p>Эта страница доступна администратору и маркетологу.</p>
        )}
      </div>
    </DefaultTemplate>
  )
}
