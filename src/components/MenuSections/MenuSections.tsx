'use client'
import { useState } from 'react'
import {
  emptyFilter,
  type FilterState,
  facetOptions,
  results,
  toQuery,
  update,
} from '@/lib/catalogFilter'
import type { MenuTab } from '@/lib/navigation'
import { CatalogRefinements } from '../CatalogRefinements/CatalogRefinements'
import { MenuDrill } from '../MenuDrill/MenuDrill'
import styles from './MenuSections.module.css'

/** Та же выдача, порядок и уточнения, что на /catalog; выбор не требует прохода по папкам. */
export function MenuSections({ tab, onNavigate }: { tab: MenuTab; onNavigate: () => void }) {
  const [state, setState] = useState<FilterState>({ ...emptyFilter, group: tab.key })
  const options = facetOptions(tab.items, tab.facets, state)
  const found = results(tab.items, state, tab.facets)
  const change = (patch: Partial<FilterState>) => setState(update(state, patch))
  const sections = tab.key === 'software' ? options.directions : options.types
  const selected = tab.key === 'software' ? state.direction : options.typeSelected
  return (
    <div className={styles.root}>
      <div className={styles.filters}>
        <label>
          {tab.key === 'software' ? 'Направление' : 'Категория'}
          <select
            aria-label={tab.key === 'software' ? 'Направление' : 'Категория'}
            value={selected ?? ''}
            onChange={(e) =>
              change(
                tab.key === 'software'
                  ? { direction: e.target.value || null, vendors: [] }
                  : { type: e.target.value || null, vendors: [] },
              )
            }
          >
            <option value="">Все</option>
            {sections.map((item) => (
              <option key={item.value} value={item.value}>
                {item.label}
              </option>
            ))}
          </select>
        </label>
        {options.vendors.length > 0 && (
          <label>
            Производитель
            <select
              aria-label="Производитель"
              value={state.vendors[0] ?? ''}
              onChange={(e) => change({ vendors: e.target.value ? [e.target.value] : [] })}
            >
              <option value="">Все</option>
              {options.vendors.map((item) => (
                <option key={item.value} value={item.value}>
                  {item.label}
                </option>
              ))}
            </select>
          </label>
        )}
      </div>
      <CatalogRefinements facets={tab.facets} lines={tab.lines} state={state} onChange={change} />
      <MenuDrill
        column={{
          title: `Найдено: ${found.total}`,
          allHref: `/catalog?${toQuery(state)}`,
          items: found.items.slice(0, 6),
        }}
        onNavigate={onNavigate}
      />
    </div>
  )
}
