'use client'

import { Check } from 'lucide-react'
import { useT } from '@/components/LangProvider/LangProvider'
import { usePickerContext } from '../PickerProvider/PickerProvider'
import styles from './PickerSwitches.module.css'

/**
 * Переключатели подбора (редакция, срок подписки): крупные сегменты над шагами.
 * Выбранный — светлый, как выбранная строка варианта ниже, с галочкой.
 */
export function PickerSwitches() {
  const t = useT()
  const { view, state, chooseSwitch } = usePickerContext()
  return view.switches.map((sw) => (
    <fieldset key={sw.key} className={styles.switch}>
      <legend className={styles.legend}>{t(sw.title)}</legend>
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
            <span className={styles.value}>{t(option.value)}</span>
            <Check size={16} strokeWidth={1.75} aria-hidden="true" className={styles.check} />
            {option.note && <span className={styles.note}>{t(option.note)}</span>}
          </label>
        ))}
      </div>
    </fieldset>
  ))
}
