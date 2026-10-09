'use client'

import { usePickerContext } from '../PickerProvider/PickerProvider'
import { PickerStep } from '../PickerStep/PickerStep'
import styles from './PickerSteps.module.css'

/**
 * Подбор комплекта: переключатели (редакция, срок) сверху, дальше шаги по номерам.
 * Без подбора и без предложений — короткая подсказка, что цену назовёт менеджер.
 */
export function PickerSteps() {
  const { view, state, chooseSwitch, openRequest } = usePickerContext()
  if (!view.steps.length)
    return (
      <p className={styles.empty}>
        Цена и комплектация — по запросу.{' '}
        <button type="button" className={styles.link} onClick={() => openRequest('price')}>
          Запросить цену
        </button>
      </p>
    )
  return (
    <div className={styles.steps}>
      {view.switches.map((sw) => (
        <fieldset key={sw.key} className={styles.switch}>
          <legend className={styles.legend}>{sw.title}</legend>
          <div className={styles.segments}>
            {sw.options.map((option) => (
              <label
                key={option.value}
                className={styles.segment}
                data-checked={state.switches[sw.key] === option.value}
              >
                <input
                  type="radio"
                  name={`switch-${sw.key}`}
                  className="visually-hidden"
                  checked={state.switches[sw.key] === option.value}
                  onChange={() => chooseSwitch(sw.key, option.value)}
                />
                <span className={styles.value}>{option.value}</span>
                {option.note && <span className={styles.note}>{option.note}</span>}
              </label>
            ))}
          </div>
        </fieldset>
      ))}
      {view.steps.map((step, index) => (
        <PickerStep key={step.key} step={step} number={view.steps.length > 1 ? index + 1 : null} />
      ))}
    </div>
  )
}
