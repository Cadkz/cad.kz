'use client'

import { Info } from 'lucide-react'
import { type FormEvent, useEffect, useRef, useState } from 'react'
import { CONSENT_TEXT, validateForm } from '@/domain/order.mjs'
import { Button } from '../Button/Button'
import { CheckboxField } from '../CheckboxField/CheckboxField'
import { TextAreaField, TextField } from '../Field/Field'
import { RadioChips } from '../RadioChips/RadioChips'
import styles from './CheckoutForm.module.css'

export type FormValues = {
  buyer: {
    type: 'individual' | 'company'
    name: string
    phone: string
    email: string
    companyName?: string
    bin?: string
  }
  comment: string
  consent: true
}

type Props = {
  sending: boolean
  canSubmit: boolean
  confirmPrice: boolean
  serverErrors: Record<string, string>
  formError: string
  priceNotice: string
  onSubmit: (values: FormValues) => void
}

const buyerTypes = [
  { value: 'company', label: 'Юридическое лицо' },
  { value: 'individual', label: 'Физическое лицо' },
]

function readForm(form: HTMLFormElement, type: string) {
  const data = new FormData(form)
  const get = (name: string) => String(data.get(name) ?? '')
  return {
    buyer: {
      type,
      name: get('name'),
      phone: get('phone'),
      email: get('email'),
      companyName: get('companyName'),
      bin: get('bin'),
    },
    comment: get('comment'),
    consent: data.get('consent') === 'on',
  }
}

/** Форма оформления. Подсказки по полям мгновенные, окончательная проверка всё равно на сервере. */
export function CheckoutForm({
  sending,
  canSubmit,
  confirmPrice,
  serverErrors,
  formError,
  priceNotice,
  onSubmit,
}: Props) {
  const form = useRef<HTMLFormElement>(null)
  const [type, setType] = useState('company')
  const [errors, setErrors] = useState<Record<string, string>>({})

  useEffect(() => setErrors(serverErrors), [serverErrors])
  useEffect(() => {
    if (Object.keys(errors).length)
      form.current?.querySelector<HTMLElement>('[aria-invalid="true"]')?.focus()
  }, [errors])

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const result = validateForm(readForm(event.currentTarget, type))
    if (!result.ok) return setErrors(result.errors)
    setErrors({})
    onSubmit({ ...result.value, consent: true })
  }

  /** Как только покупатель правит поле, ошибка этого поля убирается. */
  function clearError(event: FormEvent<HTMLFormElement>) {
    const name = (event.target as HTMLInputElement).name
    if (name && errors[name]) setErrors(({ [name]: _removed, ...rest }) => rest)
  }

  return (
    <form ref={form} className={styles.form} noValidate onSubmit={submit} onInput={clearError}>
      <fieldset className={styles.group}>
        <legend className={styles.legend}>Контакты</legend>
        <div className={styles.grid}>
          <div className={styles.wide}>
            <TextField name="name" label="Имя" autoComplete="name" error={errors.name} />
          </div>
          <TextField
            name="phone"
            type="tel"
            inputMode="tel"
            label="Телефон"
            autoComplete="tel"
            placeholder="+7 701 123-45-67"
            error={errors.phone}
          />
          <TextField
            name="email"
            type="email"
            label="Электронная почта"
            autoComplete="email"
            placeholder="name@company.kz"
            error={errors.email}
          />
        </div>
      </fieldset>

      <fieldset className={styles.group}>
        <legend className={styles.legend}>Покупатель</legend>
        <RadioChips
          legend="Кто покупает"
          name="type"
          value={type}
          options={buyerTypes}
          onChange={setType}
          error={errors.type}
        />
        {type === 'company' && (
          <div className={styles.grid}>
            <TextField
              name="companyName"
              label="Название организации"
              autoComplete="organization"
              error={errors.companyName}
            />
            <TextField
              name="bin"
              label="БИН"
              inputMode="numeric"
              hint="12 цифр. Для ИП укажите ИИН"
              error={errors.bin}
            />
          </div>
        )}
      </fieldset>

      <TextAreaField
        name="comment"
        label="Комментарий"
        hint="Например, нужен счёт на оплату или консультация по комплектации"
        error={errors.comment}
      />
      <CheckboxField name="consent" label={CONSENT_TEXT} error={errors.consent} />

      {formError && (
        <p role="alert" className={styles.alert}>
          {formError}
        </p>
      )}
      {priceNotice && (
        <p role="alert" className={styles.notice}>
          <Info size={20} strokeWidth={1.75} aria-hidden="true" />
          {priceNotice}
        </p>
      )}
      <p className={styles.demo}>
        <Info size={16} strokeWidth={1.75} aria-hidden="true" />
        Демоверсия: заявка сохранится в учебной базе и менеджерам не передаётся.
      </p>
      <Button type="submit" disabled={sending || !canSubmit}>
        {sending ? 'Отправляем…' : confirmPrice ? 'Подтвердить новую сумму' : 'Отправить заявку'}
      </Button>
    </form>
  )
}
