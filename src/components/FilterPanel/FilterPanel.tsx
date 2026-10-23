'use client'

import { GROUP_LABELS, POPULAR_LABEL } from '@/domain/catalogNavigation.mjs'
import { type FilterState, type facetOptions, POPULAR } from '@/lib/catalogFilter'
import { Chip } from '../Chip/Chip'
import { FilterChecks } from '../FilterChecks/FilterChecks'
import styles from './FilterPanel.module.css'

type Options = ReturnType<typeof facetOptions>
type Props = {
  state: FilterState
  options: Options
  onChange: (change: Partial<FilterState>) => void
  onReset: () => void
  /** Есть ли плитки «Популярных решений» (админка «Главная»): тогда и вкладка. */
  hasPopular: boolean
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
export function FilterPanel({ state, options, onChange, onReset, hasPopular }: Props) {
  return (
    <div className={styles.panel}>
      {/* Вкладки в том же порядке и с теми же названиями, что в меню «Каталог». */}
      <fieldset className={styles.tabs}>
        <legend className="visually-hidden">Группа каталога</legend>
        <Chip selected={state.group === null} onClick={() => onChange({ group: null })}>
          Все
        </Chip>
        {hasPopular && (
          <Chip selected={state.group === POPULAR} onClick={() => onChange({ group: POPULAR })}>
            {POPULAR_LABEL}
          </Chip>
        )}
        {options.groups.map((group) => (
          <Chip key={group} selected={state.group === group} onClick={() => onChange({ group })}>
            {GROUP_LABELS[group]}
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
                onChange({
                  group: 'software',
                  direction: state.direction === option.value ? null : option.value,
                })
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
              selected={options.typeSelected === option.value}
              onClick={() =>
                onChange({
                  group: options.typeGroup,
                  type: options.typeSelected === option.value ? null : option.value,
                })
              }
            >
              {option.label}
            </Chip>
          ))}
        </fieldset>
      )}
      {/* В направлении или типе производителя выбирают плитками над товарами (CatalogSteps). */}
      {(!(state.direction || state.type) || state.vendors.length > 1) &&
        options.vendors.length > 0 && (
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
      {options.features.map((group) => (
        <FilterChecks
          key={group.key}
          title={group.label}
          options={group.options}
          limit={6}
          selected={state.features[group.key] ?? []}
          onToggle={(value) =>
            onChange({
              features: {
                ...state.features,
                [group.key]: toggle(state.features[group.key] ?? [], value),
              },
            })
          }
        />
      ))}
      <button type="button" className={styles.reset} onClick={onReset}>
        Очистить условия
      </button>
    </div>
  )
}
