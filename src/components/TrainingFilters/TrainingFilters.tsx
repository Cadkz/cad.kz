'use client'

import { useT } from '@/components/LangProvider/LangProvider'
import type { TrainingState, trainingOptions } from '@/domain/trainingFilter.mjs'
import { Chip } from '../Chip/Chip'
import { FilterChecks } from '../FilterChecks/FilterChecks'
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
      <fieldset className={styles.group}>
        <legend className={styles.title}>{t('Порядок')}</legend>
        <div className={styles.row}>
          <Chip selected={state.sort === 'topic'} onClick={() => onChange({ sort: 'topic' })}>
            {t('По направлениям')}
          </Chip>
          <Chip selected={state.sort === 'start'} onClick={() => onChange({ sort: 'start' })}>
            {t('Ближайший старт')}
          </Chip>
        </div>
      </fieldset>
      {options.topics.length > 0 && (
        <fieldset className={styles.group}>
          <legend className={styles.title}>{t('Направление')}</legend>
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
        </fieldset>
      )}
      {options.months.length > 0 && (
        <fieldset className={styles.group}>
          <legend className={styles.title}>{t('Месяц старта')}</legend>
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
        </fieldset>
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
