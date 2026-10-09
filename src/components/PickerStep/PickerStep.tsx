'use client'

import { ChevronDown } from 'lucide-react'
import { useState } from 'react'
import { itemUnavailable, offerFor, type PickerStep as Step } from '@/domain/picker.mjs'
import { PickerOption } from '../PickerOption/PickerOption'
import { usePickerContext } from '../PickerProvider/PickerProvider'
import styles from './PickerStep.module.css'

const controls = { base: 'base', one: 'radio', many: 'checkbox', bundle: 'checkbox' } as const

/** Один шаг подбора: заголовок с номером, подсказка и варианты. Длинный список свёрнут. */
export function PickerStep({ step, number }: { step: Step; number: number | null }) {
  const picker = usePickerContext()
  const { view, state } = picker
  const switchText = view.switches.map((sw) => state.switches[sw.key]).join(', ')
  const muted = Boolean(state.bundle) && step.mode !== 'bundle'

  const isChecked = (key: string) => {
    if (step.mode === 'base') return !state.bundle
    if (step.mode === 'one') return state.one[step.key] === key
    if (step.mode === 'many') return state.many.includes(key)
    return state.bundle === key
  }
  const change = (key: string) => {
    if (step.mode === 'one') picker.chooseOne(step.key, key)
    if (step.mode === 'many') picker.toggle(key)
    if (step.mode === 'bundle') picker.chooseBundle(key)
  }

  const options = step.items.map((item) => (
    <PickerOption
      key={item.key}
      control={controls[step.mode]}
      name={step.key}
      label={item.label}
      note={item.note}
      price={offerFor(item, view.switches, state.switches)?.price ?? null}
      checked={isChecked(item.key)}
      disabled={itemUnavailable(item, view.switches, state.switches)}
      disabledNote={`нет в ${switchText}`}
      onChange={() => change(item.key)}
      anchor={item.anchor}
    />
  ))
  const chosen = step.items.filter((item) => isChecked(item.key)).length
  // Открыт сразу, если что-то уже выбрано (например, по старому адресу); дальше — как решит человек.
  const [openAtStart] = useState(chosen > 0)

  return (
    <fieldset className={styles.step} data-muted={muted}>
      {/* Единственный шаг не подписываем заново: заголовок секции уже говорит, что выбирать. */}
      <legend className={number == null ? 'visually-hidden' : styles.head}>
        {number != null && <span className={styles.number}>{number}</span>}
        {step.title}
      </legend>
      {step.hint && <p className={styles.hint}>{step.hint}</p>}
      {muted && (
        <p className={styles.notice}>
          Сейчас выбран готовый комплект.{' '}
          <button type="button" className={styles.reset} onClick={() => picker.chooseBundle(null)}>
            Собрать самому
          </button>
        </p>
      )}
      {step.collapsed ? (
        <details className={styles.more} open={openAtStart || undefined}>
          <summary className={styles.summary}>
            {chosen > 0 ? `Выбрано: ${chosen}` : 'Показать варианты'}
            <ChevronDown
              size={16}
              strokeWidth={1.75}
              aria-hidden="true"
              className={styles.chevron}
            />
          </summary>
          <div className={styles.list}>{options}</div>
        </details>
      ) : (
        <div className={styles.list}>{options}</div>
      )}
    </fieldset>
  )
}
