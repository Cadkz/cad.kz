'use client'

import { isFiltering, type PriceGridState } from '@/lib/usePriceGrid'
import styles from './PriceFilters.module.css'

type Option = { id: number; title: string }
type Props = { grid: PriceGridState; sections: Option[] }

const CURRENCIES = ['KZT', 'USD', 'EUR', 'RUB']
const toId = (value: string) => (value ? Number(value) : null)
const toFolder = (value: string) => (value === 'none' ? 'none' : toId(value))

/**
 * Фильтры цен: поиск, производитель (та же папка, что слева в пути), раздел, валюта, видимость,
 * без цены, изменённые. Вкладка и папка — не фильтры: «Сбросить» их не трогает.
 */
export function PriceFilters({ grid, sections }: Props) {
  const { filter, setFilter } = grid
  const changed = isFiltering(filter)
  return (
    <div className={styles.root}>
      <div className={styles.fields}>
        <label className={styles.field}>
          <span>Поиск</span>
          <input
            className={styles.search}
            type="search"
            placeholder="Во вкладке: название, комплектация, ID"
            value={filter.query}
            onChange={(event) => setFilter({ query: event.target.value })}
          />
        </label>
        <label className={styles.field}>
          <span>Производитель</span>
          <select
            value={filter.vendor ?? ''}
            onChange={(event) =>
              grid.go({ group: filter.group, vendor: toFolder(event.target.value) })
            }
          >
            <option value="">Все</option>
            {grid.folders.map((folder) => (
              <option key={folder.vendor} value={folder.vendor}>
                {folder.title}
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
        {!grid.showFolders && (
          <span className={styles.count}>
            Показано {grid.visible.length} из {grid.total}
          </span>
        )}
        {changed && (
          <button type="button" className={styles.link} onClick={grid.resetFilter}>
            Сбросить фильтры
          </button>
        )}
      </div>
    </div>
  )
}
