'use client'

import type { CatalogGroup } from '@/lib/catalog'
import type { FilterState, facetOptions } from '@/lib/catalogFilter'
import { Chip } from '../Chip/Chip'
import { FilterChecks } from '../FilterChecks/FilterChecks'
import styles from './FilterPanel.module.css'

type Options = ReturnType<typeof facetOptions>
type Props = {
  state: FilterState
  options: Options
  onChange: (change: Partial<FilterState>) => void
  onReset: () => void
}

const groupLabels: Record<CatalogGroup, string> = {
  software: 'Программное обеспечение',
  hardware: 'Оборудование',
  service: 'Услуги',
}

function toggle(list: string[], value: string) {
  return list.includes(value) ? list.filter((item) => item !== value) : [...list, value]
}

/**
 * Сколько производителей видно сразу (замечание владельца 22.10.2026): на компьютере фильтр
 * заканчивается примерно на уровне номеров страниц под карточками, остальные — по «Ещё».
 */
const VENDORS_SHOWN = 8

/**
 * Панель условий фильтра: группа, направление или тип, производитель, задачи.
 * Когда выбрано направление или тип, производителя выбирают карточками над товарами
 * (CatalogSteps), поэтому здесь его списка нет. Задачи свёрнуты: это уточнение, а не основной путь.
 */
export function FilterPanel({ state, options, onChange, onReset }: Props) {
  return (
    <div className={styles.panel}>
      <fieldset className={styles.tabs}>
        <legend className="visually-hidden">Группа каталога</legend>
        <Chip selected={state.group === null} onClick={() => onChange({ group: null })}>
          Все
        </Chip>
        {options.groups.map((group) => (
          <Chip key={group} selected={state.group === group} onClick={() => onChange({ group })}>
            {groupLabels[group]}
          </Chip>
        ))}
      </fieldset>
      {options.directions.length > 0 && (
        <fieldset className={styles.group}>
          <legend className={styles.title}>Направление</legend>
          {options.directions.map((option) => (
            <Chip
              key={option.value}
              look="option"
              selected={state.direction === option.value}
              onClick={() =>
                onChange({ direction: state.direction === option.value ? null : option.value })
              }
            >
              {option.label}
            </Chip>
          ))}
        </fieldset>
      )}
      {options.types.length > 0 && (
        <fieldset className={styles.group}>
          <legend className={styles.title}>
            {options.typeGroup === 'service' ? 'Вид услуги' : 'Тип оборудования'}
          </legend>
          {options.types.map((option) => (
            <Chip
              key={option.value}
              look="option"
              selected={state.type === option.value}
              onClick={() => onChange({ type: state.type === option.value ? null : option.value })}
            >
              {option.label}
            </Chip>
          ))}
        </fieldset>
      )}
      {(!(state.direction || state.type) || state.vendors.length > 1) && (
        <FilterChecks
          title="Производитель"
          options={options.vendors}
          selected={state.vendors}
          onToggle={(value) => onChange({ vendors: toggle(state.vendors, value) })}
          limit={VENDORS_SHOWN}
        />
      )}
      {options.tasks.length > 0 && (
        <details className={styles.more} open={state.tasks.length > 0}>
          <summary className={styles.summary}>Уточнить по задачам</summary>
          <FilterChecks
            title="Задачи"
            options={options.tasks}
            selected={state.tasks}
            onToggle={(value) => onChange({ tasks: toggle(state.tasks, value) })}
          />
        </details>
      )}
      <button type="button" className={styles.reset} onClick={onReset}>
        Сбросить фильтр
      </button>
    </div>
  )
}
