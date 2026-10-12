'use client'

import { ArrowLeft } from 'lucide-react'
import { type FormEvent, useRef, useState } from 'react'
import { CONSENT_TEXT, validateContact } from '@/domain/siteRequest.mjs'
import { Button, ButtonLink } from '../Button/Button'
import { CheckboxField } from '../CheckboxField/CheckboxField'
import { TextAreaField, TextField } from '../Field/Field'
import { WhatsappIcon } from '../icons/icons'
import styles from './AssistantHandoff.module.css'

type Props = {
  conversationId: string
  whatsappHref: string | null
  onBack: () => void
}

/**
 * «Передать менеджеру» из чата: имя, телефон, комментарий, согласие. Заявка уходит в /api/request
 * с ключом разговора — переписку сервер берёт из своей базы и кладёт в лид Битрикс24.
 * В демо честно говорим, что менеджерам заявка не уходит.
 */
export function AssistantHandoff({ conversationId, whatsappHref, onBack }: Props) {
  const key = useRef<string | null>(null)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [formError, setFormError] = useState('')
  const [sending, setSending] = useState(false)
  const [sent, setSent] = useState<{ number: string; demo: boolean } | null>(null)

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
          kind: 'consult',
          source: 'assistant',
          conversationId,
          page: window.location.pathname,
          button: 'Чат с Кади: передать менеджеру',
          items: [],
        }),
      })
      const result = await response.json()
      if (response.ok) setSent({ number: result.number, demo: result.mode === 'demo' })
      else if (result.errors) setErrors(result.errors)
      else setFormError(result.error || 'Не удалось отправить заявку')
    } catch {
      setFormError('Нет связи с сервером. Проверьте интернет и отправьте ещё раз.')
    } finally {
      setSending(false)
    }
  }

  return (
    <div className={styles.handoff}>
      <button type="button" className={styles.back} onClick={onBack} data-autofocus>
        <ArrowLeft size={16} strokeWidth={1.75} aria-hidden="true" />
        Вернуться к разговору
      </button>
      {sent ? (
        <div className={styles.done} role="status">
          <p className={styles.doneTitle}>Заявка {sent.number} сохранена вместе с перепиской</p>
          <p>
            {sent.demo
              ? 'В демоверсии она не передаётся менеджерам.'
              : 'Менеджер увидит весь разговор и свяжется с вами.'}
          </p>
        </div>
      ) : (
        <form className={styles.form} onSubmit={submit} noValidate>
          <div>
            <h3 className={styles.title}>Передать разговор менеджеру</h3>
            <p className={styles.lead}>Менеджер увидит всю переписку и продолжит с этого места.</p>
          </div>
          <TextField
            label="Имя"
            name="name"
            id="kadi-name"
            autoComplete="name"
            error={errors.name}
          />
          <TextField
            label="Телефон"
            name="phone"
            id="kadi-phone"
            type="tel"
            autoComplete="tel"
            placeholder="+7 701 123-45-67"
            error={errors.phone}
          />
          <TextAreaField
            label="Комментарий"
            name="comment"
            id="kadi-comment"
            hint="Необязательно. Например, когда удобно говорить."
            rows={2}
            error={errors.comment}
          />
          <CheckboxField
            name="consent"
            id="kadi-consent"
            label={CONSENT_TEXT}
            error={errors.consent}
          />
          {(formError || errors.idempotencyKey) && (
            <p className={styles.error} role="alert">
              {formError || errors.idempotencyKey}
            </p>
          )}
          <Button type="submit" block disabled={sending || !conversationId}>
            {sending ? 'Отправляем…' : 'Передать менеджеру'}
          </Button>
        </form>
      )}
      {whatsappHref && (
        <ButtonLink href={whatsappHref} variant="outline" block external>
          <WhatsappIcon size={20} />
          Написать в WhatsApp
        </ButtonLink>
      )}
    </div>
  )
}
