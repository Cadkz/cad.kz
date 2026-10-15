'use client'

import type { PriceGridState } from '@/lib/usePriceGrid'
import styles from './PriceFilters.module.css'

type Option = { id: number; title: string }
type Props = { grid: PriceGridState; vendors: Option[]; sections: Option[] }

const CURRENCIES = ['KZT', 'USD', 'EUR', 'RUB']
const toId = (value: string) => (value ? Number(value) : null)

/** Фильтры таблицы цен: поиск, производитель, раздел, валюта, видимость, без цены, изменённые. */
export function PriceFilters({ grid, vendors, sections }: Props) {
  const { filter, setFilter } = grid
  const changed = Object.values(filter).some(
    (value) => value !== '' && value !== null && value !== false && value !== 'all',
  )
  return (
    <div className={styles.root}>
      <div className={styles.fields}>
        <label className={styles.field}>
          <span>Поиск</span>
          <input
            className={styles.search}
            type="search"
            placeholder="Название, комплектация или ID"
            value={filter.query}
            onChange={(event) => setFilter({ query: event.target.value })}
          />
        </label>
        <label className={styles.field}>
          <span>Производитель</span>
          <select
            value={filter.vendor ?? ''}
            onChange={(event) => setFilter({ vendor: toId(event.target.value) })}
          >
            <option value="">Все</option>
            {vendors.map((vendor) => (
              <option key={vendor.id} value={vendor.id}>
                {vendor.title}
              </option>
            ))}
          </select>
        </label>
        <label className={styles.field}>
          <span>Раздел</span>
          <select
            value={filter.section ?? ''}
            onChange={(event) => setFilter({ section: toId(event.target.value) })}
          >
            <option value="">Все</option>
            {sections.map((section) => (
              <option key={section.id} value={section.id}>
                {section.title}
              </option>
            ))}
          </select>
        </label>
        <label className={styles.field}>
          <span>Валюта</span>
          <select
            value={filter.currency}
            onChange={(event) => setFilter({ currency: event.target.value })}
          >
            <option value="">Все</option>
            {CURRENCIES.map((currency) => (
              <option key={currency}>{currency}</option>
            ))}
          </select>
        </label>
        <label className={styles.field}>
          <span>На сайте</span>
          <select
            value={filter.status}
            onChange={(event) => setFilter({ status: event.target.value as typeof filter.status })}
          >
            <option value="all">Все</option>
            <option value="published">Опубликованные</option>
            <option value="draft">Черновики</option>
          </select>
        </label>
      </div>
      <div className={styles.toggles}>
        <label className={styles.check}>
          <input
            type="checkbox"
            checked={filter.noPrice}
            onChange={(event) => setFilter({ noPrice: event.target.checked })}
          />
          Без цены (по запросу или нет курса)
        </label>
        <label className={styles.check}>
          <input
            type="checkbox"
            checked={filter.onlyEdited}
            onChange={(event) => setFilter({ onlyEdited: event.target.checked })}
          />
          Только изменённые мной
        </label>
        <span className={styles.count}>
          Показано {grid.visible.length} из {grid.total}
        </span>
        {changed && (
          <button type="button" className={styles.link} onClick={grid.resetFilter}>
            Сбросить фильтры
          </button>
        )}
      </div>
    </div>
  )
}
