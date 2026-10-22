'use client'

import { SlidersHorizontal } from 'lucide-react'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import type { CatalogItem, CatalogLine, Facet } from '@/lib/catalog'
import {
  autoVendor,
  emptyFilter,
  type FilterState,
  facetOptions,
  fromSearch,
  groupedResults,
  pruneVendors,
  results,
  toQuery,
  update,
} from '@/lib/catalogFilter'
import { vendorStepOn, vendorTiles } from '@/lib/catalogVendors'
import type { Picture } from '@/lib/pictures'
import { positions } from '@/lib/plural'
import { Button } from '../Button/Button'
import { CatalogGroups } from '../CatalogGroups/CatalogGroups'
import { CatalogSteps } from '../CatalogSteps/CatalogSteps'
import { Drawer } from '../Drawer/Drawer'
import { FilterPanel } from '../FilterPanel/FilterPanel'
import { Mascot } from '../Mascot/Mascot'
import { Pagination } from '../Pagination/Pagination'
import { ProductCard } from '../ProductCard/ProductCard'
import { Reveal } from '../Reveal/Reveal'
import { VendorTiles } from '../VendorTiles/VendorTiles'
import styles from './CatalogFilter.module.css'

type Props = {
  items: CatalogItem[]
  facets: Facet[]
  lines: CatalogLine[]
  /** Логотипы производителей для плиток шага «производитель». */
  vendorLogos: Record<string, Picture>
  initial: FilterState
}

/**
 * Каскадный фильтр каталога по данным CMS. Все товары приходят с сервера одним списком,
 * фильтрация мгновенная в браузере, выбор сохраняется в адресе страницы.
 * От 960 px фильтр слева, на телефоне — в выдвижной панели.
 */
export function CatalogFilter({ items, facets, lines, vendorLogos, initial }: Props) {
  // Ссылка с производителем, которого нет в направлении, тоже не даёт пустой экран.
  const [state, setState] = useState(() => pruneVendors(items, initial))
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
    const restore = () => setState(pruneVendors(items, fromSearch(window.location.search)))
    window.addEventListener('popstate', restore)
    return () => window.removeEventListener('popstate', restore)
  }, [items])

  // Один производитель в разделе — сразу его товары, без шага выбора производителя.
  const view = useMemo(() => autoVendor(items, state), [items, state])
  const options = useMemo(() => facetOptions(items, facets, view), [items, facets, view])
  const found = useMemo(() => results(items, view, facets), [items, view, facets])
  const groups = useMemo(() => groupedResults(items, view, lines), [items, view, lines])
  // В направлении сначала производители, как папки в Битриксе (решение владельца 22.10.2026).
  const tiles = useMemo(() => vendorTiles(items, facets, lines, view), [items, facets, lines, view])
  const vendorStep = vendorStepOn(view, tiles)
  const change = (patch: Partial<FilterState>) => commit(pruneVendors(items, update(state, patch)))
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
            Найдено: {positions(found.total)}
          </p>
          <span className={styles.mobileOnly}>
            <Button variant="outline" size="sm" onClick={() => setPanelOpen(true)}>
              <SlidersHorizontal size={16} strokeWidth={1.75} aria-hidden="true" />
              Фильтры
            </Button>
          </span>
        </div>
        <CatalogSteps
          facets={facets}
          lines={lines}
          state={view}
          auto={view !== state}
          vendorStep={vendorStep}
          onChange={change}
        />
        {vendorStep ? (
          <VendorTiles
            tiles={tiles}
            logos={vendorLogos}
            onPick={(vendor) => commit(update(state, { vendors: [vendor] }), true)}
          />
        ) : groups?.length ? (
          <CatalogGroups key={toQuery(view)} groups={groups} />
        ) : found.items.length ? (
          <ul className={styles.grid}>
            {found.items.map((item, index) => (
              <Reveal as="li" key={item.id} step={index % 3}>
                <ProductCard product={item} />
              </Reveal>
            ))}
          </ul>
        ) : (
          <div className={styles.empty}>
            <div className={styles.emptyBody}>
              <p>По выбранным условиям товаров нет.</p>
              <Button onClick={reset}>Сбросить фильтр</Button>
            </div>
            <Mascot pose="search" size="sm" className={styles.mascot} />
          </div>
        )}
        {!groups && !vendorStep && (
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
            Показать товары
          </Button>
        </div>
      </Drawer>
    </div>
  )
}
