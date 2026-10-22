'use client'

import { ChevronLeft } from 'lucide-react'
import type { CatalogLine, Facet } from '@/lib/catalog'
import type { FilterState } from '@/lib/catalogFilter'
import styles from './CatalogSteps.module.css'

type Props = {
  facets: Facet[]
  lines: CatalogLine[]
  /** Выбор, как его показывает каталог (с подставленным единственным производителем). */
  state: FilterState
  /** Производителя подставил сам каталог: возвращаться к списку производителей некуда. */
  auto: boolean
  /** Сейчас шаг «производитель»: плитки, путь — «Раздел: производители». */
  vendorStep: boolean
  onChange: (patch: Partial<FilterState>) => void
}

/**
 * Путь в разделе каталога, как папки: «Раздел: производители» над плитками (VendorTiles), после
 * выбора — «← Все производители · Autodesk», в линейке — «← Все программы Autodesk · Линейка».
 */
export function CatalogSteps({ facets, lines, state, auto, vendorStep, onChange }: Props) {
  const section = state.type ?? state.direction
  if (!section) return null
  const sectionTitle = facets.find((facet) => facet.slug === section)?.title ?? ''

  if (vendorStep) {
    return (
      <div className={styles.root}>
        <p className={styles.crumbs}>{sectionTitle}: выберите производителя</p>
      </div>
    )
  }
  if (state.vendors.length !== 1) return null
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
          {line ? `Все программы ${vendor}` : `${sectionTitle}: все производители`}
        </button>
        <span>{line ? line.title : vendor}</span>
      </p>
    </div>
  )
}
