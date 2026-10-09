'use client'

import { Check } from 'lucide-react'
import styles from './PickerOption.module.css'

type Props = {
  /** base — входит всегда, one — радиокнопка, many и bundle — галочка (можно снять). */
  control: 'base' | 'radio' | 'checkbox'
  name: string
  label: string
  note: string | null
  price: string | null
  checked: boolean
  disabled: boolean
  disabledNote: string
  onChange: () => void
  anchor?: string
}

/** Строка варианта в подборе: выбор, название с пояснением и цена, посчитанная сервером. */
export function PickerOption(props: Props) {
  const { control, name, label, note, price, checked, disabled, disabledNote, onChange, anchor } =
    props
  const priceText = disabled ? disabledNote : (price ?? 'по запросу')
  const body = (
    <>
      <span className={styles.text}>
        <span className={styles.label}>{label}</span>
        {note && <span className={styles.note}>{note}</span>}
      </span>
      <span className={styles.price} data-muted={disabled || !price}>
        {priceText}
      </span>
    </>
  )
  if (control === 'base')
    return (
      <div className={styles.option} id={anchor} data-checked={checked} data-disabled={disabled}>
        <span className={styles.included} role="img" aria-label="Входит всегда">
          <Check size={16} strokeWidth={1.75} aria-hidden="true" />
        </span>
        {body}
      </div>
    )
  return (
    <label className={styles.option} id={anchor} data-checked={checked} data-disabled={disabled}>
      <input
        type={control}
        name={name}
        className={styles.input}
        checked={checked}
        disabled={disabled}
        onChange={onChange}
      />
      {body}
    </label>
  )
}
