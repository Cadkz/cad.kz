'use client'

import { ChevronLeft } from 'lucide-react'
import type { CatalogLine, Facet } from '@/lib/catalog'
import type { FilterState, SectionStep } from '@/lib/catalogFilter'
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
  /** Сейчас шаг «тип оборудования» или «подраздел» плитками (SectionTiles). */
  sectionStep: SectionStep['kind'] | null
  onChange: (patch: Partial<FilterState>) => void
}

type Back = { label: string; patch: Partial<FilterState> }

type Path = { back: Back | null; current: string; prompt: string | null }

/** Шаг вверх по разделам оборудования: из подраздела в тип, из типа во всё оборудование. */
function sectionUp({ facets, state }: Props): Back | null {
  const parent = facets.find((facet) => facet.slug === state.type)?.parent
  if (parent) {
    const title = facets.find((facet) => facet.slug === parent)?.title ?? ''
    return { label: title, patch: { type: parent } }
  }
  return state.type && state.group === 'hardware'
    ? { label: 'Всё оборудование', patch: { type: null } }
    : null
}

/** Выбран один производитель: назад к его программам из линейки или к списку производителей. */
function vendorPath({ lines, state, auto }: Props, current: string): Path | null {
  const vendor = state.vendors.length === 1 ? (state.vendors[0] ?? '') : null
  if (!vendor) return null
  const line = state.line ? lines.find((item) => item.id === state.line) : null
  if (line)
    return {
      back: { label: `Все программы ${vendor}`, patch: { line: null } },
      current: line.title,
      prompt: null,
    }
  if (auto) return null
  return {
    back: { label: `${current}: все производители`, patch: { vendors: [] } },
    current: vendor,
    prompt: null,
  }
}

/** Куда ведёт «Назад» и что написано рядом: от линейки вверх до всего оборудования. */
function stepPath(props: Props, section: string): Path {
  const current = props.facets.find((facet) => facet.slug === section)?.title ?? ''
  if (props.sectionStep === 'sub' || props.vendorStep) {
    const prompt = props.sectionStep === 'sub' ? 'выберите раздел' : 'выберите производителя'
    return { back: sectionUp(props), current, prompt }
  }
  return vendorPath(props, current) ?? { back: sectionUp(props), current, prompt: null }
}

/**
 * Путь в разделе каталога, как папки: «Раздел: выберите производителя» над плитками, после
 * выбора — «← Все производители · Autodesk», в линейке — «← Все программы Autodesk · Линейка».
 * В оборудовании: «← Всё оборудование · 3D-сканеры», в подразделе — «← Широкоформатные
 * плоттеры · Плоттеры» (замечание владельца 22.10.2026).
 */
export function CatalogSteps(props: Props) {
  const { state, sectionStep, onChange } = props
  if (sectionStep === 'type') {
    return (
      <div className={styles.root}>
        <p className={styles.crumbs}>Оборудование: выберите тип</p>
      </div>
    )
  }
  const section = state.type ?? state.direction
  if (!section) return null
  const { back, current, prompt } = stepPath(props, section)
  if (!back && !prompt) return null
  return (
    <div className={styles.root}>
      <p className={styles.crumbs}>
        {back && (
          <button type="button" className={styles.back} onClick={() => onChange(back.patch)}>
            <ChevronLeft size={16} strokeWidth={1.75} aria-hidden="true" />
            {back.label}
          </button>
        )}
        <span>{prompt ? `${current}: ${prompt}` : current}</span>
      </p>
    </div>
  )
}
