import styles from './RadioChips.module.css'

type Option = { value: string; label: string }
type Props = {
  legend: string
  name: string
  value: string
  options: Option[]
  onChange: (value: string) => void
  error?: string
}

/** Выбор одного из нескольких вариантов крупными кнопками. Работает как обычные радиокнопки. */
export function RadioChips({ legend, name, value, options, onChange, error }: Props) {
  return (
    <fieldset className={styles.group} aria-describedby={error ? `${name}-note` : undefined}>
      <legend className={styles.legend}>{legend}</legend>
      <div className={styles.options}>
        {options.map((option) => (
          <label key={option.value} className={styles.option}>
            <input
              type="radio"
              name={name}
              value={option.value}
              checked={value === option.value}
              onChange={() => onChange(option.value)}
              className="visually-hidden"
            />
            <span className={styles.chip}>{option.label}</span>
          </label>
        ))}
      </div>
      {error && (
        <p id={`${name}-note`} className={styles.error} role="alert">
          {error}
        </p>
      )}
    </fieldset>
  )
}
