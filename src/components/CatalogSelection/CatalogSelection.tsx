'use client'

import { X } from 'lucide-react'
import type { FilterState, featureOptions } from '@/lib/catalogFilter'
import { Chip } from '../Chip/Chip'
import styles from './CatalogSelection.module.css'

type Props = {
  state: FilterState
  groups: ReturnType<typeof featureOptions>
  onChange: (change: Partial<FilterState>) => void
}

/** Активные условия над выдачей: видны и на телефоне при закрытой панели фильтров. */
export function CatalogSelection({ state, groups, onChange }: Props) {
  const choices = groups.flatMap((group) =>
    group.options
      .filter((option) => state.features[group.key]?.includes(option.value))
      .map((option) => ({
        key: `${group.key}:${option.value}`,
        label: `${group.label}: ${option.label}`,
        remove: () =>
          onChange({
            features: {
              ...state.features,
              [group.key]: (state.features[group.key] ?? []).filter(
                (value) => value !== option.value,
              ),
            },
          }),
      })),
  )
  for (const key of ['vendors', 'tasks'] as const) {
    for (const value of state[key])
      choices.push({
        key: `${key}:${value}`,
        label: value,
        remove: () => onChange({ [key]: state[key].filter((entry) => entry !== value) }),
      })
  }
  if (!choices.length) return null
  return (
    <section className={styles.root} aria-label="Выбранные фильтры">
      {choices.map((choice) => (
        <Chip
          key={choice.key}
          selected
          onClick={choice.remove}
          aria-label={`Снять фильтр: ${choice.label}`}
        >
          {choice.label} <X size={16} strokeWidth={1.75} aria-hidden="true" />
        </Chip>
      ))}
      <button
        type="button"
        className={styles.clear}
        onClick={() => onChange({ features: {}, vendors: [], tasks: [], line: null })}
      >
        Очистить условия
      </button>
    </section>
  )
}
