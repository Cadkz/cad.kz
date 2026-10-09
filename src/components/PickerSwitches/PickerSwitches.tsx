'use client'

import { usePickerContext } from '../PickerProvider/PickerProvider'
import styles from './PickerSwitches.module.css'

/** Переключатели подбора (редакция, срок подписки): крупные сегменты над шагами. */
export function PickerSwitches() {
  const { view, state, chooseSwitch } = usePickerContext()
  return view.switches.map((sw) => (
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
  ))
}
