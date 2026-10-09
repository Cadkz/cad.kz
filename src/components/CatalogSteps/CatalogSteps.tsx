'use client'

import { ChevronLeft } from 'lucide-react'
import { useMemo } from 'react'
import type { CatalogItem, CatalogLine, Facet } from '@/lib/catalog'
import { type FilterState, matches } from '@/lib/catalogFilter'
import { positions } from '@/lib/plural'
import { OTHER, vendorTree } from '../../domain/catalogTree.mjs'
import styles from './CatalogSteps.module.css'

type Props = {
  items: CatalogItem[]
  facets: Facet[]
  lines: CatalogLine[]
  state: FilterState
  onChange: (patch: Partial<FilterState>) => void
}

/**
 * Путь по разделу каталога, как в меню: производители карточками → линейки производителя.
 * Показывается, когда выбрано направление или тип; товары — ниже, в общей сетке.
 */
export function CatalogSteps({ items, facets, lines, state, onChange }: Props) {
  const section = state.type ?? state.direction
  const tree = useMemo(() => {
    if (!section) return []
    const scope = items.filter((item) => matches(item, { ...state, line: null }, 'vendors'))
    const titles = new Map(
      scope.flatMap((item) => (item.vendor ? [[item.vendor, item.vendor]] : [])),
    )
    const pins = facets.find((facet) => facet.slug === section)?.pins ?? []
    const tree = vendorTree(
      scope.map((item) => ({ ...item, vendor: item.vendor ?? null })),
      lines.map((line) => ({ ...line })),
      titles as Map<string, string>,
      pins,
    )
    return tree.filter((vendor) => vendor.key !== OTHER)
  }, [items, facets, lines, state, section])

  if (!section || tree.length === 0) return null
  const sectionTitle = facets.find((facet) => facet.slug === section)?.title ?? ''
  const vendor = state.vendors.length === 1 ? tree.find((v) => v.title === state.vendors[0]) : null

  if (!vendor) {
    if (state.vendors.length || tree.length < 2) return null
    return (
      <div className={styles.root}>
        <p className={styles.crumbs}>{sectionTitle}: производители</p>
        <ul className={styles.cards}>
          {tree.map((item) => (
            <li key={item.key}>
              <button
                type="button"
                className={styles.card}
                onClick={() => onChange({ vendors: [item.title] })}
              >
                <span className={styles.title}>{item.title}</span>
                <span className={styles.hint}>
                  {item.lines.length > 1
                    ? item.lines.map((l) => l.title).join(' · ')
                    : positions(item.lines.reduce((sum, l) => sum + l.items.length, 0))}
                </span>
              </button>
            </li>
          ))}
        </ul>
      </div>
    )
  }

  const line = vendor.lines.find((item) => item.key === state.line)
  const back = (
    <button
      type="button"
      className={styles.back}
      onClick={() => (line ? onChange({ line: null }) : onChange({ vendors: [] }))}
    >
      <ChevronLeft size={16} strokeWidth={1.75} aria-hidden="true" />
      {line ? `Все линейки ${vendor.title}` : 'Все производители'}
    </button>
  )
  if (vendor.lines.length < 2 || line)
    return (
      <div className={styles.root}>
        <p className={styles.crumbs}>
          {back}
          {line && <span>{line.title}</span>}
        </p>
      </div>
    )
  return (
    <div className={styles.root}>
      <p className={styles.crumbs}>
        {back}
        <span>{vendor.title}: линейки</span>
      </p>
      <ul className={styles.cards}>
        {vendor.lines.map((item) => (
          <li key={item.key}>
            <button
              type="button"
              className={styles.card}
              onClick={() => onChange({ line: item.key })}
            >
              <span className={styles.title}>{item.title}</span>
              <span className={styles.hint}>
                {item.items
                  .slice(0, 3)
                  .map((product) => product.title)
                  .join(' · ')}
              </span>
            </button>
          </li>
        ))}
      </ul>
    </div>
  )
}
