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

/** Сколько групп характеристик открыто сразу: формат, технология, цвет, разрешение. */
const FEATURES_OPEN = 4

/**
 * Панель условий фильтра: группа, направление или тип, производитель, задачи.
 * Все условия необязательны: товары уже видны. Задачи свёрнуты, чтобы не перегружать панель.
 */
export function FilterPanel({ state, options, onChange, onReset, hasPopular }: Props) {
  return (
    <div className={styles.panel}>
      {/* Вкладки в том же порядке и с теми же названиями, что в меню «Каталог». */}
      <fieldset className={styles.tabs}>
        <legend className="visually-hidden">Группа каталога</legend>
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
        <label className={styles.selectLabel}>
          Направление
          <select
            className={styles.select}
            aria-label="Направление"
            value={state.direction ?? ''}
            onChange={(event) =>
              onChange({ group: 'software', direction: event.target.value || null })
            }
          >
            <option value="">Все направления</option>
            {options.directions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>
      )}
      {options.types.length > 0 && (
        <label className={styles.selectLabel}>
          {options.typeGroup === 'service' ? 'Вид услуги' : 'Тип оборудования'}
          <select
            className={styles.select}
            aria-label="Тип оборудования или услуги"
            value={options.typeSelected ?? ''}
            onChange={(event) =>
              onChange({ group: options.typeGroup, type: event.target.value || null })
            }
          >
            <option value="">Все</option>
            {options.types.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>
      )}
      {/* Производитель уточняет выдачу, отдельного шага с плитками нет. */}
      {options.vendors.length > 0 && (
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
      {/* Характеристики: первые группы открыты, остальные свёрнуты (образец владельца 23.10.2026). */}
      {options.features.map((group, index) => (
        <FilterChecks
          key={group.key}
          title={group.label}
          options={group.options}
          limit={6}
          collapsible
          defaultOpen={index < FEATURES_OPEN}
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
