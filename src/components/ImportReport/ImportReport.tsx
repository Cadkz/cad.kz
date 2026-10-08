'use client'

import { summarizeCatalog } from '@/domain/bitrixReport.mjs'
import type { Catalog } from '@/lib/bitrixImportClient'
import styles from './ImportReport.module.css'

/** Сколько строк показать в каждом списке проблем; полный список — в отчёте файлом. */
const SHOW = 30

function Counts({ title, rows }: { title: string; rows: [string, number][] }) {
  return (
    <div>
      <h3 className={styles.heading}>{title}</h3>
      <ul className={styles.counts}>
        {rows.map(([name, total]) => (
          <li key={name}>
            <span>{name}</span>
            <span className={styles.num}>{total}</span>
          </li>
        ))}
      </ul>
    </div>
  )
}

/** Итог проверочного прогона: что и сколько будет перенесено, что вызывает вопросы. */
export function ImportReport({ catalog }: { catalog: Catalog }) {
  const s = summarizeCatalog(catalog)
  return (
    <div className={styles.root}>
      <ul className={styles.summary}>
        <li>
          Товаров в выгрузке {s.stats.productsTotal}, включённых {s.stats.productsActive}. К
          переносу: <b>{s.products}</b>.
        </li>
        <li>
          Предложений в выгрузке {s.stats.offersTotal}, включённых {s.stats.offersActive}. К
          переносу: <b>{s.offers}</b>, из них с ценой <b>{s.pricedOffers}</b>.
        </li>
        <li>
          Товаров с вариантами {s.productsWithOffers}, простых товаров с ценой в карточке{' '}
          {s.simplePriced}. Без цены (кнопка «Запросить цену»): <b>{s.noPrice}</b>.
        </li>
        <li>
          Картинок на старом сайте: {s.images} у {s.withImages} товаров.
        </li>
      </ul>
      <div className={styles.columns}>
        <Counts title="Типы товаров" rows={s.kinds} />
        <Counts title="Валюты цен" rows={s.currencies} />
        <Counts title="Производители" rows={s.manufacturers.slice(0, 12)} />
      </div>
      <h3 className={styles.heading}>Что стоит проверить</h3>
      {s.issues.length === 0 && <p>Замечаний нет.</p>}
      {s.issues.map((group) => (
        <details key={group.type} className={styles.issue}>
          <summary>
            {group.title}: <b>{group.total}</b>
          </summary>
          <ul className={styles.items}>
            {group.items.slice(0, SHOW).map((issue) => (
              <li key={issue.id}>
                [{issue.id}] {issue.title}
                {issue.detail ? ` — ${issue.detail}` : ''}
              </li>
            ))}
            {group.items.length > SHOW && (
              <li>…и ещё {group.items.length - SHOW}, полный список — в отчёте файлом</li>
            )}
          </ul>
        </details>
      ))}
    </div>
  )
}
