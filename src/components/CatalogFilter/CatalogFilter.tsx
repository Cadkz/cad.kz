'use client'

import { SlidersHorizontal } from 'lucide-react'
import { useSearchParams } from 'next/navigation'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import type { CatalogItem, CatalogLine, Facet } from '@/lib/catalog'
import {
  browseState,
  emptyFilter,
  type FilterState,
  facetOptions,
  fromSearch,
  POPULAR,
  pruneVendors,
  results,
  toQuery,
  update,
} from '@/lib/catalogFilter'
import type { Picture } from '@/lib/pictures'
import { positions } from '@/lib/plural'
import type { PopularCardData } from '@/lib/popular'
import { Button } from '../Button/Button'
import { CatalogEntry } from '../CatalogEntry/CatalogEntry'
import { CatalogPopular } from '../CatalogPopular/CatalogPopular'
import { CatalogRefinements } from '../CatalogRefinements/CatalogRefinements'
import { CatalogSelection } from '../CatalogSelection/CatalogSelection'
import { Drawer } from '../Drawer/Drawer'
import { FilterPanel } from '../FilterPanel/FilterPanel'
import { Mascot } from '../Mascot/Mascot'
import { Pagination } from '../Pagination/Pagination'
import { Reveal } from '../Reveal/Reveal'
import styles from './CatalogFilter.module.css'

type Props = {
  items: CatalogItem[]
  facets: Facet[]
  lines: CatalogLine[]
  /** Логотипы производителей для плиток шага «производитель». */
  vendorLogos: Record<string, Picture>
  initial: FilterState
  /** Плитки «Популярных решений» — те же, что в меню «Каталог». */
  popular?: PopularCardData[]
}

/**
 * Каскадный фильтр каталога по данным CMS. Все товары приходят с сервера одним списком,
 * фильтрация мгновенная в браузере, выбор сохраняется в адресе страницы.
 * От 960 px фильтр слева, на телефоне — в выдвижной панели.
 */
export function CatalogFilter({ items, facets, lines, initial, popular = [] }: Props) {
  // Условия берутся из адреса, а не только с сервера: при «Назад» из товара Next.js показывает
  // сохранённую страницу каталога со старым стартом (пустым), а в адресе — нужный шаг
  // (замечание владельца 26.10.2026: «назад» из Artec вёл в пустой каталог).
  const search = useSearchParams()
  // Ссылка с производителем, которого нет в направлении, тоже не даёт пустой экран.
  const [state, setState] = useState(() =>
    pruneVendors(
      items,
      browseState(
        search.size ? fromSearch(search.toString()) : initial,
        facets,
        popular.length > 0,
      ),
    ),
  )
  const [panelOpen, setPanelOpen] = useState(false)
  const top = useRef<HTMLDivElement>(null)

  // Каждый шаг — запись в истории браузера: «Назад» (кнопка мыши, жест) возвращает на шаг
  // назад в каталоге, а не уводит со страницы (замечание владельца 22.10.2026).
  const commit = useCallback((next: FilterState, scroll = false) => {
    setState(next)
    const query = toQuery(next)
    const url = `${window.location.pathname}${query ? `?${query}` : ''}`
    if (url !== `${window.location.pathname}${window.location.search}`)
      window.history.pushState(null, '', url)
    if (scroll) top.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }, [])

  useEffect(() => {
    const restore = () =>
      setState(
        pruneVendors(
          items,
          browseState(fromSearch(window.location.search), facets, popular.length > 0),
        ),
      )
    window.addEventListener('popstate', restore)
    return () => window.removeEventListener('popstate', restore)
  }, [items, facets, popular.length])

  const view = state
  const options = useMemo(() => facetOptions(items, facets, view), [items, facets, view])
  const found = useMemo(() => results(items, view, facets), [items, view, facets])
  const change = (patch: Partial<FilterState>) => commit(pruneVendors(items, update(state, patch)))
  const reset = () =>
    commit({ ...emptyFilter, group: state.group, direction: state.direction, type: state.type })
  const closePanel = useCallback(() => setPanelOpen(false), [])

  const popularView = state.group === POPULAR
  const panel = (
    <FilterPanel
      state={state}
      options={options}
      onChange={change}
      onReset={reset}
      hasPopular={popular.length > 0}
    />
  )

  return (
    <div className={styles.shell}>
      <section className={styles.sidebar} aria-label="Фильтр каталога">
        {panel}
      </section>
      <div ref={top} className={styles.results}>
        <div className={styles.head}>
          <p className={styles.count} aria-live="polite">
            {popularView ? 'Чаще всего выбирают' : `Найдено: ${positions(found.total)}`}
          </p>
          <span className={styles.mobileOnly}>
            <Button variant="outline" size="sm" onClick={() => setPanelOpen(true)}>
              <SlidersHorizontal size={16} strokeWidth={1.75} aria-hidden="true" />
              Фильтры
            </Button>
          </span>
        </div>
        <CatalogRefinements facets={facets} lines={lines} state={state} onChange={change} />
        <CatalogSelection state={state} groups={options.features} onChange={change} />
        {popularView ? (
          <CatalogPopular cards={popular} />
        ) : found.items.length ? (
          <ul className={styles.grid}>
            {found.items.map((item, index) => (
              <Reveal as="li" key={item.id} step={index % 3}>
                <CatalogEntry product={item} />
              </Reveal>
            ))}
          </ul>
        ) : (
          <div className={styles.empty}>
            <div className={styles.emptyBody}>
              <p>По выбранным условиям товаров нет.</p>
              <Button onClick={reset}>Очистить условия в этом разделе</Button>
            </div>
            <Mascot pose="search" size="sm" className={styles.mascot} />
          </div>
        )}
        {!popularView && (
          <Pagination
            page={found.page}
            pages={found.pages}
            onPage={(page) => commit({ ...state, page }, true)}
          />
        )}
      </div>
      <Drawer open={panelOpen} onClose={closePanel} title="Фильтр каталога" side="left">
        {panel}
        <div className={styles.drawerFoot}>
          <Button block onClick={closePanel}>
            {popularView ? 'Показать популярные решения' : `Показать: ${positions(found.total)}`}
          </Button>
        </div>
      </Drawer>
    </div>
  )
}
