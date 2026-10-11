'use client'

import { type FormEvent, useRef, useState } from 'react'
import { CONSENT_TEXT, RENEW_PROGRAMS, validateRenewal } from '@/domain/siteRequest.mjs'
import { Button } from '../Button/Button'
import { CheckboxField } from '../CheckboxField/CheckboxField'
import { TextAreaField, TextField } from '../Field/Field'
import { RadioChips } from '../RadioChips/RadioChips'
import styles from './RenewForm.module.css'

const OTHER = 'other'

/**
 * Заявка на продление: программа (чипы или своё название), номер лицензии и число мест — если
 * клиент их знает, имя и телефон. Сохраняет сервер (/api/request, источник renew), менеджер
 * присылает счёт. В демо честно говорим, что менеджерам заявка не уходит.
 */
export function RenewForm({ program: initial }: { program: string | null }) {
  const known = RENEW_PROGRAMS.find((p) => p.toLowerCase() === initial?.toLowerCase())
  // ?program=other — «Другая программа» с главной: поле названия пустое.
  const custom = !known && initial && initial.toLowerCase() !== OTHER ? initial : ''
  const key = useRef<string | null>(null)
  const [program, setProgram] = useState(known ?? (initial ? OTHER : (RENEW_PROGRAMS[0] ?? '')))
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [formError, setFormError] = useState('')
  const [sending, setSending] = useState(false)
  const [sent, setSent] = useState<string | null>(null)

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const data = new FormData(event.currentTarget)
    const field = (name: string) => String(data.get(name) ?? '')
    const body = {
      name: field('name'),
      phone: field('phone'),
      comment: field('comment'),
      consent: data.get('consent') === 'on',
      renewal: {
        program: program === OTHER ? field('program') : program,
        license: field('license'),
        seats: field('seats'),
      },
    }
    const checked = validateRenewal(body)
    setErrors(checked.ok ? {} : checked.errors)
    setFormError('')
    if (!checked.ok) return
    key.current ??= crypto.randomUUID()
    setSending(true)
    try {
      const response = await fetch('/api/request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...body,
          idempotencyKey: key.current,
          kind: 'renew',
          source: 'renew',
          button: 'Отправить заявку на продление',
          items: [],
        }),
      })
      const result = await response.json()
      if (response.ok) setSent(result.number)
      else if (result.errors) setErrors(result.errors)
      else setFormError(result.error || 'Не удалось отправить заявку')
    } catch {
      setFormError('Нет связи с сервером. Проверьте интернет и отправьте ещё раз.')
    } finally {
      setSending(false)
    }
  }

  if (sent)
    return (
      <div className={styles.done} role="status">
        <p className={styles.doneTitle}>Заявка {sent} сохранена</p>
        <p>В демоверсии она не передаётся менеджерам.</p>
      </div>
    )

  return (
    <form className={styles.form} onSubmit={submit} noValidate>
      <RadioChips
        legend="Какую программу продлить"
        name="renew-program"
        value={program}
        options={[
          ...RENEW_PROGRAMS.map((p) => ({ value: p, label: p })),
          { value: OTHER, label: 'Другая' },
        ]}
        onChange={setProgram}
      />
      {program === OTHER && (
        <TextField
          label="Название программы"
          name="program"
          id="renew-program-name"
          defaultValue={custom}
          error={errors.program}
        />
      )}
      {program !== OTHER && errors.program && (
        <p className={styles.error} role="alert">
          {errors.program}
        </p>
      )}
      <div className={styles.row}>
        <TextField
          label="Номер лицензии"
          name="license"
          id="renew-license"
          hint="Если знаете. Нет под рукой — менеджер найдёт сам."
          error={errors.license}
        />
        <TextField
          label="Число мест"
          name="seats"
          id="renew-seats"
          type="number"
          min={1}
          max={999}
          inputMode="numeric"
          error={errors.seats}
        />
      </div>
      <TextField label="Имя" name="name" id="renew-name" autoComplete="name" error={errors.name} />
      <TextField
        label="Телефон"
        name="phone"
        id="renew-phone"
        type="tel"
        autoComplete="tel"
        placeholder="+7 701 123-45-67"
        error={errors.phone}
      />
      <TextAreaField
        label="Комментарий"
        name="comment"
        id="renew-comment"
        hint="Например: нужен счёт на организацию или переход на другую редакцию."
        rows={3}
        error={errors.comment}
      />
      <CheckboxField
        name="consent"
        id="renew-consent"
        label={CONSENT_TEXT}
        error={errors.consent}
      />
      {(formError || errors.items || errors.kind) && (
        <p className={styles.error} role="alert">
          {formError || errors.items || errors.kind}
        </p>
      )}
      <Button type="submit" block disabled={sending}>
        {sending ? 'Отправляем…' : 'Отправить заявку на продление'}
      </Button>
    </form>
  )
}
