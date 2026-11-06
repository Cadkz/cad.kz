'use client'

import { SlidersHorizontal } from 'lucide-react'
import { useSearchParams } from 'next/navigation'
import {
  addTransitionType,
  startTransition,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react'
import { useT } from '@/components/LangProvider/LangProvider'
import { familyTaskHref } from '@/domain/familyGroups.mjs'
import { CATALOG_FILTER, FLOW_LIMIT, pageMotion } from '@/domain/motion.mjs'
import { startNote } from '@/domain/trainingFilter.mjs'
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
import { CatalogTabs } from '../CatalogTabs/CatalogTabs'
import { Drawer } from '../Drawer/Drawer'
import { FilterPanel } from '../FilterPanel/FilterPanel'
import { FilterRail } from '../FilterRail/FilterRail'
import { activeCount, FilterToggle } from '../FilterToggle/FilterToggle'
import { FlowItem } from '../FlowItem/FlowItem'
import { FlowPage } from '../FlowPage/FlowPage'
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
  /**
   * Каталог на главной (правка владельца 02.11.2026, вечер): тот же каталог, что на /catalog
   * (шаги в адресе, «Назад» мышью — шаг назад, страницы), но вкладки строкой над блоком, а
   * колонка фильтра выезжает по кнопке «Фильтры».
   */
  compact?: boolean
  /**
   * Страница /catalog (правка владельца 03.11.2026): от 960 px как на главной — вкладки строкой
   * сверху и кнопка «Скрыть фильтры», но колонка фильтра сразу открыта. На телефоне — как было.
   */
  collapsible?: boolean
}

/** С этой ширины фильтр на главной — колонка слева, а не выдвижная панель. */
const WIDE = '(min-width: 960px)'

/**
 * Каскадный фильтр каталога по данным CMS. Все товары приходят с сервера одним списком,
 * фильтрация мгновенная в браузере, выбор сохраняется в адресе страницы.
 * От 960 px фильтр слева, на телефоне — в выдвижной панели.
 */
/** Карточка семейства из направления — со ссылкой ?task= (src/domain/familyGroups.mjs). */
const withTask = (item: CatalogItem, direction: string | null) => ({
  ...item,
  href: familyTaskHref(item.href, direction),
})

/** У курса с расписанием — «Старт 1 декабря» (в выбранном месяце, если месяц выбран). */
const withStart = (
  item: CatalogItem,
  month: string | null,
  t: { lang: 'ru' | 'kk' | 'en' } & ((text: string) => string),
) => (item.starts?.length ? { ...item, start: startNote(item, month, t.lang, t('Старт')) } : item)

export function CatalogFilter({
  items,
  facets,
  lines,
  vendorLogos,
  initial,
  popular = [],
  compact = false,
  collapsible = false,
}: Props) {
  const t = useT()
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
  const commit = useCallback(
    (next: FilterState, scroll = false, motion: string = CATALOG_FILTER) => {
      // Переход с типом: карточки переезжают на новые места, страницы листаются в сторону
      // (FlowItem, FlowPage — этап 2 анимаций, 02.11.2026).
      startTransition(() => {
        addTransitionType(motion)
        setState(next)
      })
      const query = toQuery(next)
      const url = `${window.location.pathname}${query ? `?${query}` : ''}`
      if (url !== `${window.location.pathname}${window.location.search}`)
        window.history.pushState(null, '', url)
      if (scroll) top.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    },
    [],
  )

  useEffect(() => {
    const restore = () => setState(pruneVendors(items, fromSearch(window.location.search)))
    window.addEventListener('popstate', restore)
    return () => window.removeEventListener('popstate', restore)
  }, [items])

  // Один производитель в разделе — сразу его товары, без шага выбора производителя.
  const view = useMemo(() => autoVendor(items, state), [items, state])
  const options = useMemo(() => facetOptions(items, facets, view), [items, facets, view])
  // Ссылки на семейства из направления — с ?task=: на странице сателлитов SCAD группа
  // направления (например, основания и фундаменты) первой (замечание владельца 27.10.2026).
  const found = useMemo(() => {
    const result = results(items, view, facets)
    return {
      ...result,
      items: result.items.map((item) =>
        withStart(withTask(item, view.direction), view.training.month, t),
      ),
    }
  }, [items, view, facets, t])
  const groups = useMemo(
    () =>
      groupedResults(items, view, lines)?.map((group) => ({
        ...group,
        href: group.href && familyTaskHref(group.href, view.direction),
        items: group.items.map((item) =>
          withStart(withTask(item, view.direction), view.training.month, t),
        ),
      })),
    [items, view, lines, t],
  )
  // В направлении сначала производители, как папки в Битриксе (решение владельца 22.10.2026).
  const tiles = useMemo(
    () =>
      vendorTiles(items, facets, lines, view).map((tile) => ({
        ...tile,
        href: tile.href && familyTaskHref(tile.href, view.direction),
      })),
    [items, facets, lines, view],
  )
  // Оборудование: сначала типы, в типе с подразделами — подразделы плитками. Считается по выбору
  // без подставленного производителя: иначе у плоттеров (только Canon) шаг бы пропускался.
  const sections = useMemo(() => sectionStep(items, facets, state), [items, facets, state])
  const vendorStep = !sections && vendorStepOn(view, tiles)
  const change = (patch: Partial<FilterState>) => commit(pruneVendors(items, update(state, patch)))
  const reset = () =>
    commit({ ...emptyFilter, group: state.group, direction: state.direction, type: state.type })
  const closePanel = useCallback(() => setPanelOpen(false), [])
  // На главной «Фильтры» на компьютере раздвигают колонку фильтра слева, карточки сужаются;
  // без затемнения экрана (правка владельца 02.11.2026, вечер). Уже 960 px — выдвижная панель.
  const wide = compact || collapsible
  const [sideOpen, setSideOpen] = useState(collapsible)
  const openFilters = () => {
    if (wide && window.matchMedia(WIDE).matches) setSideOpen((open) => !open)
    else setPanelOpen(true)
  }

  const popularView = state.group === POPULAR
  // Вкладки групп в колонке не нужны, когда они строкой сверху; в панели телефона на /catalog — нужны.
  const panel = (tabs: boolean) => (
    <FilterPanel
      state={state}
      options={options}
      onChange={change}
      onReset={reset}
      hasPopular={popular.length > 0}
      tabs={tabs}
    />
  )
  const shownItems = found.items
  const paged = !popularView && !sections && !groups && !vendorStep

  // toggle — кнопка над блоком (раздвигает колонку), иначе — кнопка телефона (открывает панель).
  const filtersButton = (toggle: boolean) =>
    toggle ? (
      <FilterToggle open={sideOpen} count={activeCount(state)} onClick={openFilters} />
    ) : (
      <Button variant="tool" size="sm" onClick={openFilters}>
        <SlidersHorizontal size={16} strokeWidth={1.75} aria-hidden="true" />
        {t('Фильтры')}
      </Button>
    )

  return (
    <div
      className={wide ? `${styles.shell} ${styles.compact}` : styles.shell}
      data-side={wide && sideOpen ? 'open' : undefined}
    >
      {wide && (
        <div
          className={[styles.head, styles.headStart, collapsible && styles.wideOnly]
            .filter(Boolean)
            .join(' ')}
        >
          {/* «Фильтры» слева, над колонкой, которую они раздвигают; за ними вкладки
              (правка владельца 06.11.2026). */}
          {filtersButton(true)}
          <CatalogTabs
            selected={state.group}
            groups={options.groups}
            hasPopular={popular.length > 0}
            onChange={change}
            row
          />
        </div>
      )}
      {/* Свёрнутый фильтр — направляющая слева (вариант B, 07.11.2026). */}
      {wide && (
        <FilterRail
          className={styles.rail}
          hidden={sideOpen}
          count={activeCount(state)}
          onOpen={() => setSideOpen(true)}
        />
      )}
      <section
        className={styles.sidebar}
        aria-label={t('Фильтр каталога')}
        inert={wide && !sideOpen}
      >
        <div className={styles.sideInner}>{panel(!wide)}</div>
      </section>
      <div ref={top} className={styles.results}>
        {!compact && (
          <div className={styles.head}>
            <p className={styles.count} aria-live="polite">
              {popularView
                ? t('Чаще всего выбирают')
                : t('Найдено: {count}', { count: positions(found.total, t) })}
            </p>
            <span className={styles.mobileOnly}>{filtersButton(false)}</span>
          </div>
        )}
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
          <CatalogPopular cards={popular} items={items} />
        ) : sections ? (
          <SectionTiles
            tiles={sections.tiles}
            overline={t(sections.kind === 'direction' ? 'Направление' : 'Раздел')}
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
          <FlowPage page={found.page}>
            <ul data-grid="" className={styles.grid}>
              {shownItems.map((item, index) => (
                <FlowItem key={item.id} still={shownItems.length > FLOW_LIMIT}>
                  <Reveal as="li" step={index % 3}>
                    <ProductCard product={item} />
                  </Reveal>
                </FlowItem>
              ))}
            </ul>
          </FlowPage>
        ) : (
          <div className={styles.empty}>
            <div className={styles.emptyBody}>
              <p>{t('По выбранным условиям товаров нет.')}</p>
              <Button onClick={reset}>{t('Очистить условия в этом разделе')}</Button>
            </div>
            <Mascot pose="search" size="sm" className={styles.mascot} />
          </div>
        )}
        {paged && (
          <Pagination
            page={found.page}
            pages={found.pages}
            onPage={(page) => commit({ ...state, page }, true, pageMotion(state.page, page))}
          />
        )}
      </div>
      <Drawer open={panelOpen} onClose={closePanel} title={t('Фильтр каталога')} side="left">
        {panel(!compact)}
        <div className={styles.drawerFoot}>
          <Button block onClick={closePanel}>
            {t('Показать: {count}', { count: positions(found.total, t) })}
          </Button>
        </div>
      </Drawer>
    </div>
  )
}
