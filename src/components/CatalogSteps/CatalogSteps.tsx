'use client'

import { ChevronLeft } from 'lucide-react'
import Link from 'next/link'
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
  /** Выбор, как его показывает каталог (с подставленным единственным производителем). */
  state: FilterState
  /** Производителя подставил сам каталог: возвращаться к списку производителей некуда. */
  auto: boolean
  onChange: (patch: Partial<FilterState>) => void
}

/**
 * Шаг «производитель» в разделе каталога, как в меню. Товары выбранного производителя — ниже,
 * группами по линейкам (CatalogGroups), без отдельного шага с карточками линеек.
 * У производителя с одним товаром в разделе карточка сразу ведёт на этот товар.
 */
export function CatalogSteps({ items, facets, lines, state, auto, onChange }: Props) {
  const section = state.type ?? state.direction
  const tree = useMemo(() => {
    if (!section) return []
    // Как в обычном списке: семейство одной карточкой, без пакетов и программ семейства.
    const listState = { ...state, vendors: [], line: null }
    const scope = items.filter((item) => matches(item, listState))
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

  if (state.vendors.length === 0) {
    if (tree.length < 2) return null
    return (
      <div className={styles.root}>
        <p className={styles.crumbs}>{sectionTitle}: производители</p>
        <ul className={styles.cards}>
          {tree.map((vendor) => {
            const products = vendor.lines.flatMap((line) => line.items)
            const hint =
              vendor.lines.length > 1
                ? vendor.lines.map((line) => line.title).join(' · ')
                : products.length === 1
                  ? (products[0]?.title ?? '')
                  : positions(products.length)
            const body = (
              <>
                <span className={styles.title}>{vendor.title}</span>
                <span className={styles.hint}>{hint}</span>
              </>
            )
            const [only] = products
            return (
              <li key={vendor.key}>
                {products.length === 1 && only ? (
                  <Link href={only.href} className={styles.card}>
                    {body}
                  </Link>
                ) : (
                  <button
                    type="button"
                    className={styles.card}
                    onClick={() => onChange({ vendors: [vendor.title] })}
                  >
                    {body}
                  </button>
                )}
              </li>
            )
          })}
        </ul>
      </div>
    )
  }

  if (state.vendors.length > 1) return null
  const vendor = state.vendors[0] ?? ''
  const line = state.line ? lines.find((item) => item.id === state.line) : null
  if (auto && !line) return null
  return (
    <div className={styles.root}>
      <p className={styles.crumbs}>
        <button
          type="button"
          className={styles.back}
          onClick={() => (line ? onChange({ line: null }) : onChange({ vendors: [] }))}
        >
          <ChevronLeft size={16} strokeWidth={1.75} aria-hidden="true" />
          {line ? `Все программы ${vendor}` : 'Все производители'}
        </button>
        <span>{line ? line.title : vendor}</span>
      </p>
    </div>
  )
}
