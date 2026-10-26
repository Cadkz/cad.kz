import type { CatalogLine, Facet } from '@/lib/catalog'
import type { FilterState } from '@/lib/catalogFilter'
import styles from './CatalogRefinements.module.css'

/** Подразделы и линейки — необязательные уточнения над готовой выдачей. */
export function CatalogRefinements({
  facets,
  lines,
  state,
  onChange,
}: {
  facets: Facet[]
  lines: CatalogLine[]
  state: FilterState
  onChange: (patch: Partial<FilterState>) => void
}) {
  const parent = facets.find((f) => f.slug === state.type)?.parent ?? state.type
  const children = facets.filter((f) => f.parent === parent && parent)
  const ownLines = lines.filter((line) => state.vendors.includes(line.vendor))
  return (
    <div className={styles.root}>
      {children.length > 0 && (
        <label>
          Категория
          <select
            value={state.type ?? ''}
            onChange={(e) => onChange({ type: e.target.value || null })}
          >
            <option value={parent ?? ''}>Все категории</option>
            {children.map((f) => (
              <option key={f.slug} value={f.slug}>
                {f.title}
              </option>
            ))}
          </select>
        </label>
      )}
      {(ownLines.length > 0 || state.line) && (
        <label>
          Линейка
          <select
            value={state.line ?? ''}
            onChange={(e) => onChange({ line: e.target.value || null })}
          >
            <option value="">Все линейки</option>
            {ownLines.map((line) => (
              <option key={line.id} value={line.id}>
                {line.title}
              </option>
            ))}
            {state.line && !ownLines.some((line) => line.id === state.line) && (
              <option value={state.line}>Выбранная линейка</option>
            )}
          </select>
        </label>
      )}
    </div>
  )
}
