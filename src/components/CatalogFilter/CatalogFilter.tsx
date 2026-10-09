'use client'

import { SlidersHorizontal } from 'lucide-react'
import { useCallback, useMemo, useRef, useState } from 'react'
import type { CatalogItem, Facet } from '@/lib/catalog'
import {
  activeCount,
  emptyFilter,
  type FilterState,
  facetOptions,
  results,
  toQuery,
  update,
} from '@/lib/catalogFilter'
import { Button } from '../Button/Button'
import { Drawer } from '../Drawer/Drawer'
import { FilterPanel } from '../FilterPanel/FilterPanel'
import { Pagination } from '../Pagination/Pagination'
import { ProductCard } from '../ProductCard/ProductCard'
import styles from './CatalogFilter.module.css'

type Props = { items: CatalogItem[]; facets: Facet[]; initial: FilterState }

const plural = (n: number) => {
  const mod10 = n % 10
  const mod100 = n % 100
  if (mod10 === 1 && mod100 !== 11) return 'позиция'
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)) return 'позиции'
  return 'позиций'
}

/**
 * Каскадный фильтр каталога по данным CMS. Все товары приходят с сервера одним списком,
 * фильтрация мгновенная в браузере, выбор сохраняется в адресе страницы.
 * От 960 px фильтр слева, на телефоне — в выдвижной панели.
 */
export function CatalogFilter({ items, facets, initial }: Props) {
  const [state, setState] = useState(initial)
  const [panelOpen, setPanelOpen] = useState(false)
  const top = useRef<HTMLDivElement>(null)

  const commit = useCallback((next: FilterState, scroll = false) => {
    setState(next)
    const query = toQuery(next)
    window.history.replaceState(
      null,
      '',
      `${window.location.pathname}${query ? `?${query}` : ''}#catalog`,
    )
    if (scroll) top.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }, [])

  const options = useMemo(() => facetOptions(items, facets, state), [items, facets, state])
  const found = useMemo(() => results(items, state), [items, state])
  const active = activeCount(state)
  const change = (patch: Partial<FilterState>) => commit(update(state, patch))
  const reset = () => commit(emptyFilter)
  const closePanel = useCallback(() => setPanelOpen(false), [])

  const panel = <FilterPanel state={state} options={options} onChange={change} onReset={reset} />

  return (
    <div className={styles.shell}>
      <section className={styles.sidebar} aria-label="Фильтр каталога">
        {panel}
      </section>
      <div ref={top} className={styles.results}>
        <div className={styles.head}>
          <p className={styles.count} aria-live="polite">
            Найдено: {found.total} {plural(found.total)}
          </p>
          <span className={styles.mobileOnly}>
            <Button variant="outline" size="sm" onClick={() => setPanelOpen(true)}>
              <SlidersHorizontal size={16} strokeWidth={1.75} aria-hidden="true" />
              Фильтры{active ? ` · ${active}` : ''}
            </Button>
          </span>
        </div>
        {found.items.length ? (
          <ul className={styles.grid}>
            {found.items.map((item) => (
              <li key={item.id}>
                <ProductCard product={item} />
              </li>
            ))}
          </ul>
        ) : (
          <div className={styles.empty}>
            <p>По выбранным условиям товаров нет.</p>
            <Button variant="secondary" size="sm" onClick={reset}>
              Сбросить фильтр
            </Button>
          </div>
        )}
        <Pagination
          page={found.page}
          pages={found.pages}
          onPage={(page) => commit({ ...state, page }, true)}
        />
      </div>
      <Drawer open={panelOpen} onClose={closePanel} title="Фильтр каталога" side="left">
        {panel}
        <div className={styles.drawerFoot}>
          <Button block onClick={closePanel}>
            Показать товары ({found.total})
          </Button>
        </div>
      </Drawer>
    </div>
  )
}
