import type {
  InputHTMLAttributes,
  ReactNode,
  SelectHTMLAttributes,
  TextareaHTMLAttributes,
} from 'react'
import styles from './Field.module.css'

type Wrap = { label: string; hint?: string; error?: string; id: string; children: ReactNode }

/** Подпись, поле и подсказка/ошибка. Ошибка связана с полем через aria-describedby. */
function Wrapper({ label, hint, error, id, children }: Wrap) {
  return (
    <div className={styles.field}>
      <label htmlFor={id} className={styles.label}>
        {label}
      </label>
      {children}
      {error ? (
        <p id={`${id}-note`} className={styles.error} role="alert">
          {error}
        </p>
      ) : (
        hint && (
          <p id={`${id}-note`} className={styles.hint}>
            {hint}
          </p>
        )
      )}
    </div>
  )
}

type Base = { label: string; hint?: string; error?: string; name: string; id?: string }

function aria(id: string, hint?: string, error?: string) {
  return {
    id,
    'aria-invalid': error ? true : undefined,
    'aria-describedby': hint || error ? `${id}-note` : undefined,
  }
}

export function TextField({
  label,
  hint,
  error,
  id,
  ...rest
}: Base & InputHTMLAttributes<HTMLInputElement>) {
  const fieldId = id ?? `field-${rest.name}`
  return (
    <Wrapper label={label} hint={hint} error={error} id={fieldId}>
      <input className={styles.control} {...aria(fieldId, hint, error)} {...rest} />
    </Wrapper>
  )
}

export function SelectField({
  label,
  hint,
  error,
  id,
  children,
  ...rest
}: Base & SelectHTMLAttributes<HTMLSelectElement>) {
  const fieldId = id ?? `field-${rest.name}`
  return (
    <Wrapper label={label} hint={hint} error={error} id={fieldId}>
      <select
        className={`${styles.control} ${styles.select}`}
        {...aria(fieldId, hint, error)}
        {...rest}
      >
        {children}
      </select>
    </Wrapper>
  )
}

export function TextAreaField({
  label,
  hint,
  error,
  id,
  ...rest
}: Base & TextareaHTMLAttributes<HTMLTextAreaElement>) {
  const fieldId = id ?? `field-${rest.name}`
  return (
    <Wrapper label={label} hint={hint} error={error} id={fieldId}>
      <textarea
        className={`${styles.control} ${styles.textarea}`}
        {...aria(fieldId, hint, error)}
        {...rest}
      />
    </Wrapper>
  )
}
