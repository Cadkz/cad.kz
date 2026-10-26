'use client'

import { ListTree } from 'lucide-react'
import { useSearchParams } from 'next/navigation'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import type { CatalogItem, CatalogLine, Facet } from '@/lib/catalog'
import {
  emptyFilter,
  type FilterState,
  facetOptions,
  fromSearch,
  parentType,
  pruneVendors,
  toQuery,
  update,
} from '@/lib/catalogFilter'
import { landingShelves, popularEntries } from '@/lib/catalogShelves'
import type { Picture } from '@/lib/pictures'
import type { PopularCardData } from '@/lib/popular'
import { Button } from '../Button/Button'
import { CatalogLanding } from '../CatalogLanding/CatalogLanding'
import { CatalogSection } from '../CatalogSection/CatalogSection'
import { CatalogSelection } from '../CatalogSelection/CatalogSelection'
import { CatalogSidebar } from '../CatalogSidebar/CatalogSidebar'
import { Drawer } from '../Drawer/Drawer'
import styles from './CatalogBrowser.module.css'

type Props = {
  items: CatalogItem[]
  facets: Facet[]
  lines: CatalogLine[]
  vendorLogos: Record<string, Picture>
  initial: FilterState
  popular: PopularCardData[]
}

/**
 * Каталог по-новому (пробная ветка redesign/catalog-v2, замечания владельца 26.10.2026):
 * слева все разделы одним деревом, справа — обзор (популярные решения и плитки разделов с
 * примерами) или открытый раздел с товарами полками по производителям. Карточки одного вида
 * везде. Выбор в адресе страницы, «Назад» в браузере — шаг назад в каталоге.
 */
export function CatalogBrowser({ items, facets, lines, vendorLogos, initial, popular }: Props) {
  const search = useSearchParams()
  const [state, setState] = useState(() =>
    pruneVendors(items, search.size ? fromSearch(search.toString()) : initial),
  )
  const [panelOpen, setPanelOpen] = useState(false)
  const top = useRef<HTMLDivElement>(null)

  const commit = useCallback((next: FilterState) => {
    setState(next)
    setPanelOpen(false)
    const query = toQuery(next)
    const url = `${window.location.pathname}${query ? `?${query}` : ''}`
    if (url !== `${window.location.pathname}${window.location.search}`)
      window.history.pushState(null, '', url)
    const box = top.current?.getBoundingClientRect()
    if (box && box.top < 0) top.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }, [])

  useEffect(() => {
    const restore = () => setState(pruneVendors(items, fromSearch(window.location.search)))
    window.addEventListener('popstate', restore)
    return () => window.removeEventListener('popstate', restore)
  }, [items])

  const shelves = useMemo(() => landingShelves(items, facets), [items, facets])
  const entries = useMemo(() => popularEntries(popular, items, facets), [popular, items, facets])
  const options = useMemo(() => facetOptions(items, facets, state), [items, facets, state])
  const open = Boolean(state.direction || state.type)
  const current = state.direction ?? parentType(facets, state.type)
  const change = (patch: Partial<FilterState>) => commit(pruneVendors(items, update(state, patch)))
  const home = () => commit(emptyFilter)

  const sidebar = (
    <CatalogSidebar
      state={state}
      current={current}
      shelves={shelves}
      options={options}
      onChange={change}
      onOpen={commit}
      onHome={home}
    />
  )

  return (
    <div className={styles.shell}>
      <section className={styles.sidebar} aria-label="Разделы каталога">
        {sidebar}
      </section>
      <div ref={top} className={styles.results}>
        <div className={styles.mobileBar}>
          <Button variant="outline" size="sm" onClick={() => setPanelOpen(true)}>
            <ListTree size={16} strokeWidth={1.75} aria-hidden="true" />
            {open ? 'Разделы и фильтры' : 'Все разделы'}
          </Button>
        </div>
        {open ? (
          <>
            <CatalogSelection
              state={{ ...state, vendors: [] }}
              groups={options.features}
              onChange={change}
            />
            <CatalogSection
              key={toQuery({ ...state, page: 1 })}
              state={state}
              items={items}
              facets={facets}
              lines={lines}
              vendorLogos={vendorLogos}
              onChange={change}
              onHome={home}
            />
          </>
        ) : (
          <CatalogLanding popular={entries} shelves={shelves} onOpen={commit} />
        )}
      </div>
      <Drawer open={panelOpen} onClose={() => setPanelOpen(false)} title="Каталог" side="left">
        {sidebar}
      </Drawer>
    </div>
  )
}
