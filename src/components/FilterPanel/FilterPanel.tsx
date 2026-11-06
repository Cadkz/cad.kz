'use client'

import { useT } from '@/components/LangProvider/LangProvider'
import type { FilterState, facetOptions } from '@/lib/catalogFilter'
import { CatalogTabs } from '../CatalogTabs/CatalogTabs'
import { Chip } from '../Chip/Chip'
import { FilterChecks } from '../FilterChecks/FilterChecks'
import { FilterGroup } from '../FilterGroup/FilterGroup'
import { TrainingFilters } from '../TrainingFilters/TrainingFilters'
import styles from './FilterPanel.module.css'

type Options = ReturnType<typeof facetOptions>
type Props = {
  state: FilterState
  options: Options
  onChange: (change: Partial<FilterState>) => void
  onReset: () => void
  /** Есть ли плитки «Популярных решений» (админка «Главная»): тогда и вкладка. */
  hasPopular: boolean
  /** Вкладки групп в панели; на главной они стоят над карточками, в панели не повторяются. */
  tabs?: boolean
}

function toggle(list: string[], value: string) {
  return list.includes(value) ? list.filter((item) => item !== value) : [...list, value]
}

/**
 * Сколько производителей видно сразу (замечание владельца 22.10.2026): на компьютере фильтр
 * заканчивается примерно на уровне номеров страниц под карточками, остальные — по «Ещё».
 */
const VENDORS_SHOWN = 8

/** Сколько задач видно сразу, остальные — по «Ещё». */
const TASKS_SHOWN = 6

/** Сколько групп характеристик открыто сразу: формат, технология, цвет, разрешение. */
const FEATURES_OPEN = 4

/**
 * Панель условий фильтра: группа, направление или тип, производитель, задачи.
 * Когда выбрано направление или тип, производителя выбирают карточками над товарами
 * (CatalogSteps), поэтому здесь его списка нет. Задачи открыты, длинный список — по «Ещё».
 */
export function FilterPanel({ state, options, onChange, onReset, hasPopular, tabs = true }: Props) {
  const t = useT()
  return (
    <div className={styles.panel}>
      {tabs && (
        <CatalogTabs
          selected={state.group}
          groups={options.groups}
          hasPopular={hasPopular}
          onChange={onChange}
        />
      )}
      {options.directions.length > 0 && (
        <FilterGroup title={t('Направление')} hasSelection={state.direction != null}>
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
              {t(option.label)}
            </Chip>
          ))}
        </FilterGroup>
      )}
      {options.types.length > 0 && (
        <FilterGroup
          title={t(options.typeGroup === 'service' ? 'Вид услуги' : 'Тип оборудования')}
          hasSelection={options.typeSelected != null}
        >
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
              {t(option.label)}
            </Chip>
          ))}
        </FilterGroup>
      )}
      {options.training && (
        <TrainingFilters
          state={state.training}
          options={options.training}
          onChange={(patch) => onChange({ training: { ...state.training, ...patch } })}
        />
      )}
      {/* В направлении или типе производителя выбирают плитками над товарами (CatalogSteps). */}
      {(!(state.direction || state.type) || state.vendors.length > 1) &&
        options.vendors.length > 0 && (
          <FilterChecks
            title={t('Производитель')}
            options={options.vendors}
            selected={state.vendors}
            onToggle={(value) =>
              // Без типа характеристики подтянуты по производителю — при смене производителя
              // сбрасываются, иначе галочка плоттера оставила бы пустой список у Artec.
              onChange({
                vendors: toggle(state.vendors, value),
                ...(state.type ? {} : { features: {} }),
              })
            }
            limit={VENDORS_SHOWN}
          />
        )}
      {/* Задачи открыты сразу (правка владельца 03.11.2026), длинный список — по «Ещё». */}
      {options.tasks.length > 0 && (
        <FilterChecks
          title={t('Задачи')}
          options={options.tasks}
          selected={state.tasks}
          onToggle={(value) => onChange({ tasks: toggle(state.tasks, value) })}
          limit={TASKS_SHOWN}
        />
      )}
      {/* Характеристики: первые группы открыты, остальные свёрнуты (образец владельца 23.10.2026). */}
      {options.features.map((group, index) => (
        <FilterChecks
          key={group.key}
          title={t(group.label)}
          options={group.options}
          limit={6}
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
        {t('Очистить условия')}
      </button>
    </div>
  )
}
