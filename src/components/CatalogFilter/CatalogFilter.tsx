'use client'

import { SlidersHorizontal } from 'lucide-react'
import { useSearchParams } from 'next/navigation'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import type { CatalogItem, CatalogLine, Facet } from '@/lib/catalog'
import {
  autoVendor,
  emptyFilter,
  type FilterState,
  facetOptions,
  fromSearch,
  groupedResults,
  POPULAR,
  pruneVendors,
  results,
  sectionStep,
  toQuery,
  update,
} from '@/lib/catalogFilter'
import { vendorStepOn, vendorTiles } from '@/lib/catalogVendors'
import type { Picture } from '@/lib/pictures'
import { positions } from '@/lib/plural'
import type { PopularCardData } from '@/lib/popular'
import { Button } from '../Button/Button'
import { CatalogGroups } from '../CatalogGroups/CatalogGroups'
import { CatalogPopular } from '../CatalogPopular/CatalogPopular'
import { CatalogSelection } from '../CatalogSelection/CatalogSelection'
import { CatalogSteps } from '../CatalogSteps/CatalogSteps'
import { Drawer } from '../Drawer/Drawer'
import { FilterPanel } from '../FilterPanel/FilterPanel'
import { Mascot } from '../Mascot/Mascot'
import { Pagination } from '../Pagination/Pagination'
import { ProductCard } from '../ProductCard/ProductCard'
import { Reveal } from '../Reveal/Reveal'
import { SectionTiles } from '../SectionTiles/SectionTiles'
import { VendorTiles } from '../VendorTiles/VendorTiles'
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
export function CatalogFilter({ items, facets, lines, vendorLogos, initial, popular = [] }: Props) {
  // Условия берутся из адреса, а не только с сервера: при «Назад» из товара Next.js показывает
  // сохранённую страницу каталога со старым стартом (пустым), а в адресе — нужный шаг
  // (замечание владельца 26.10.2026: «назад» из Artec вёл в пустой каталог).
  const search = useSearchParams()
  // Ссылка с производителем, которого нет в направлении, тоже не даёт пустой экран.
  const [state, setState] = useState(() =>
    pruneVendors(items, search.size ? fromSearch(search.toString()) : initial),
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
  // Оборудование: сначала типы, в типе с подразделами — подразделы плитками. Считается по выбору
  // без подставленного производителя: иначе у плоттеров (только Canon) шаг бы пропускался.
  const sections = useMemo(() => sectionStep(items, facets, state), [items, facets, state])
  const vendorStep = !sections && vendorStepOn(view, tiles)
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
        <CatalogSteps
          facets={facets}
          lines={lines}
          state={view}
          auto={view !== state}
          vendorStep={vendorStep}
          sectionStep={sections?.kind ?? null}
          onChange={change}
        />
        <CatalogSelection state={state} groups={options.features} onChange={change} />
        {popularView ? (
          <CatalogPopular cards={popular} />
        ) : sections ? (
          <SectionTiles
            tiles={sections.tiles}
            onPick={(slug) =>
              commit(
                update(state, sections.kind === 'direction' ? { direction: slug } : { type: slug }),
                true,
              )
            }
          />
        ) : vendorStep ? (
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
              <Button onClick={reset}>Очистить условия в этом разделе</Button>
            </div>
            <Mascot pose="search" size="sm" className={styles.mascot} />
          </div>
        )}
        {!popularView && !sections && !groups && !vendorStep && (
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
            Показать: {positions(found.total)}
          </Button>
        </div>
      </Drawer>
    </div>
  )
}
