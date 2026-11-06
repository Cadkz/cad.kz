'use client'

import { useT } from '@/components/LangProvider/LangProvider'
import type { TrainingState, trainingOptions } from '@/domain/trainingFilter.mjs'
import { Chip } from '../Chip/Chip'
import { FilterChecks } from '../FilterChecks/FilterChecks'
import { FilterGroup } from '../FilterGroup/FilterGroup'
import styles from './TrainingFilters.module.css'

type Props = {
  state: TrainingState
  options: ReturnType<typeof trainingOptions>
  onChange: (patch: Partial<TrainingState>) => void
}

/**
 * Фильтры раздела «Обучение» (просьба владельца 30.10.2026, вечер): порядок, направление курса,
 * месяц старта и «Есть набор». Месяцы и набор — из расписания учебного центра.
 */
export function TrainingFilters({ state, options, onChange }: Props) {
  const t = useT()
  return (
    <>
      <FilterGroup title={t('Порядок')}>
        <div className={styles.row}>
          <Chip selected={state.sort === 'topic'} onClick={() => onChange({ sort: 'topic' })}>
            {t('По направлениям')}
          </Chip>
          <Chip selected={state.sort === 'start'} onClick={() => onChange({ sort: 'start' })}>
            {t('Ближайший старт')}
          </Chip>
        </div>
      </FilterGroup>
      {options.topics.length > 0 && (
        <FilterGroup title={t('Направление')} hasSelection={state.topic != null}>
          {options.topics.map((option) => (
            <Chip
              key={option.value}
              look="option"
              selected={state.topic === option.value}
              onClick={() =>
                onChange({ topic: state.topic === option.value ? null : option.value })
              }
            >
              {option.label}
            </Chip>
          ))}
        </FilterGroup>
      )}
      {options.months.length > 0 && (
        <FilterGroup title={t('Месяц старта')} hasSelection={state.month != null}>
          <div className={styles.row}>
            {options.months.map((option) => (
              <Chip
                key={option.value}
                selected={state.month === option.value}
                onClick={() =>
                  onChange({ month: state.month === option.value ? null : option.value })
                }
              >
                {option.label}
              </Chip>
            ))}
          </div>
        </FilterGroup>
      )}
      {(options.open > 0 || state.open) && (
        <FilterChecks
          title={t('Набор')}
          options={[{ value: 'open', label: t('Есть набор'), count: options.open }]}
          selected={state.open ? ['open'] : []}
          onToggle={() => onChange({ open: !state.open })}
        />
      )}
    </>
  )
}
