'use client'

import { type FormEvent, useRef, useState } from 'react'
import { CONSENT_TEXT, validateContact } from '@/domain/siteRequest.mjs'
import { Button } from '../Button/Button'
import { CheckboxField } from '../CheckboxField/CheckboxField'
import { TextAreaField, TextField } from '../Field/Field'
import { RadioChips } from '../RadioChips/RadioChips'
import styles from './SolutionForm.module.css'

type Props = {
  /** Направления каталога для быстрого выбора: адрес и название. */
  directions: { slug: string; title: string }[]
}

/**
 * Короткая заявка «Подобрать решение» с главной: задача своими словами, направление по желанию,
 * имя и телефон. Сохраняет сервер (/api/request, источник home); в демо честно говорим,
 * что менеджерам заявка не уходит.
 */
export function SolutionForm({ directions }: Props) {
  const key = useRef<string | null>(null)
  const [direction, setDirection] = useState('')
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [formError, setFormError] = useState('')
  const [sending, setSending] = useState(false)
  const [sent, setSent] = useState<string | null>(null)

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const data = new FormData(event.currentTarget)
    const contact = {
      name: String(data.get('name') ?? ''),
      phone: String(data.get('phone') ?? ''),
      comment: String(data.get('comment') ?? ''),
      consent: data.get('consent') === 'on',
    }
    const checked = validateContact(contact, { taskRequired: true })
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
          ...contact,
          idempotencyKey: key.current,
          kind: 'help',
          source: 'home',
          direction: direction || null,
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
      <TextAreaField
        label="Что нужно сделать"
        name="comment"
        id="solution-task"
        hint="Например: считать каркас здания из металла, 3 рабочих места. Или: нужен плоттер А0."
        rows={3}
        error={errors.comment}
      />
      {directions.length > 0 && (
        <RadioChips
          legend="Направление — если знаете"
          name="solution-direction"
          value={direction}
          options={[
            { value: '', label: 'Не знаю' },
            ...directions.map((d) => ({ value: d.slug, label: d.title })),
          ]}
          onChange={setDirection}
        />
      )}
      <TextField
        label="Имя"
        name="name"
        id="solution-name"
        autoComplete="name"
        error={errors.name}
      />
      <TextField
        label="Телефон"
        name="phone"
        id="solution-phone"
        type="tel"
        autoComplete="tel"
        placeholder="+7 701 123-45-67"
        error={errors.phone}
      />
      <CheckboxField
        name="consent"
        id="solution-consent"
        label={CONSENT_TEXT}
        error={errors.consent}
      />
      {(formError || errors.items || errors.kind) && (
        <p className={styles.error} role="alert">
          {formError || errors.items || errors.kind}
        </p>
      )}
      <Button type="submit" block disabled={sending}>
        {sending ? 'Отправляем…' : 'Отправить задачу'}
      </Button>
    </form>
  )
}
