import type { InputHTMLAttributes, ReactNode } from 'react'
import styles from './CheckboxField.module.css'

type Props = { label: ReactNode; error?: string; name: string; id?: string } & Omit<
  InputHTMLAttributes<HTMLInputElement>,
  'type' | 'id' | 'name'
>

/** Галочка с подписью и ошибкой. Ошибка связана с полем через aria-describedby. */
export function CheckboxField({ label, error, id, ...rest }: Props) {
  const fieldId = id ?? `field-${rest.name}`
  return (
    <div className={styles.field}>
      <label className={styles.row} htmlFor={fieldId}>
        <input
          type="checkbox"
          id={fieldId}
          className={styles.box}
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? `${fieldId}-note` : undefined}
          {...rest}
        />
        <span>{label}</span>
      </label>
      {error && (
        <p id={`${fieldId}-note`} className={styles.error} role="alert">
          {error}
        </p>
      )}
    </div>
  )
}
