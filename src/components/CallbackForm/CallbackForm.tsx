'use client'

import { type FormEvent, useRef, useState } from 'react'
import { CONSENT_TEXT, type RequestKind, validateContact } from '@/domain/siteRequest.mjs'
import { Button } from '../Button/Button'
import { CheckboxField } from '../CheckboxField/CheckboxField'
import { TextAreaField, TextField } from '../Field/Field'
import type { RequestLine } from '../RequestDialog/RequestDialog'
import styles from './CallbackForm.module.css'

type Props = {
  kind: RequestKind
  pageProductId: number
  familySlug: string | null
  quantity: number
  choices: { title: string; value: string }[]
  lines: RequestLine[]
}

type Sent = { number: string }

/**
 * «Перезвоните мне»: имя, телефон, комментарий и согласие. Заявку сохраняет сервер
 * (/api/request) вместе с выбором клиента; в демо честно говорим, что менеджерам она не уходит.
 */
export function CallbackForm(props: Props) {
  const { kind, pageProductId, familySlug, quantity, choices, lines } = props
  const key = useRef<string | null>(null)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [formError, setFormError] = useState('')
  const [sending, setSending] = useState(false)
  const [sent, setSent] = useState<Sent | null>(null)

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const data = new FormData(event.currentTarget)
    const contact = {
      name: String(data.get('name') ?? ''),
      phone: String(data.get('phone') ?? ''),
      comment: String(data.get('comment') ?? ''),
      consent: data.get('consent') === 'on',
    }
    const checked = validateContact(contact)
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
          kind,
          pageProductId,
          familySlug,
          quantity,
          choices,
          items: lines.map(({ productId, offerId }) => ({ productId, offerId })),
        }),
      })
      const result = await response.json()
      if (response.ok) setSent({ number: result.number })
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
        <p className={styles.doneTitle}>Заявка {sent.number} сохранена</p>
        <p>В демоверсии она не передаётся менеджерам.</p>
      </div>
    )

  return (
    <form className={styles.form} onSubmit={submit} noValidate>
      <TextField
        label="Имя"
        name="name"
        id="callback-name"
        autoComplete="name"
        error={errors.name}
      />
      <TextField
        label="Телефон"
        name="phone"
        id="callback-phone"
        type="tel"
        autoComplete="tel"
        placeholder="+7 701 123-45-67"
        error={errors.phone}
      />
      <TextAreaField
        label="Комментарий"
        name="comment"
        id="callback-comment"
        hint="Необязательно. Например, когда удобно говорить."
        rows={3}
        error={errors.comment}
      />
      <CheckboxField
        name="consent"
        id="callback-consent"
        label={CONSENT_TEXT}
        error={errors.consent}
      />
      {(formError || errors.items) && (
        <p className={styles.error} role="alert">
          {formError || errors.items}
        </p>
      )}
      <Button type="submit" block disabled={sending}>
        {sending ? 'Отправляем…' : 'Отправить заявку'}
      </Button>
    </form>
  )
}
