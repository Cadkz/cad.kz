'use client'

import { ArrowLeft } from 'lucide-react'
import { type FormEvent, useRef, useState } from 'react'
import { CONSENT_TEXT, validateContact } from '@/domain/siteRequest.mjs'
import { type CrmState, crmDoneText } from '@/lib/crmNotice'
import type { HandoffPrefill } from '@/lib/useAssistant'
import { Button, ButtonLink } from '../Button/Button'
import { CheckboxField } from '../CheckboxField/CheckboxField'
import { TextAreaField, TextField } from '../Field/Field'
import { WhatsappIcon } from '../icons/icons'
import styles from './AssistantHandoff.module.css'

type Props = {
  conversationId: string
  /** Что Кадди собрал в чате: имя и телефон подставлены в поля, остальное уйдёт менеджеру списком. */
  prefill?: HandoffPrefill
  /** Ссылка WhatsApp с уже набранным текстом: что собрал и посчитал Кадди (whatsappMessage). */
  whatsappHref: string | null
  onBack: () => void
}

/**
 * «Передать менеджеру» из чата: имя, телефон, комментарий, согласие. Заявка уходит в /api/request
 * с ключом разговора — переписку и собранное Кадди (почта, компания, продукт, сроки) сервер берёт
 * из своей базы и кладёт в лид Битрикс24. Если Кадди уже собрал контакты, они подставлены: клиент
 * проверяет и подтверждает сам. В демо честно говорим, что менеджерам заявка не уходит.
 */
export function AssistantHandoff({ conversationId, prefill, whatsappHref, onBack }: Props) {
  const key = useRef<string | null>(null)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [formError, setFormError] = useState('')
  const [sending, setSending] = useState(false)
  const [sent, setSent] = useState<{ number: string; crm: CrmState } | null>(null)

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
          button: 'Чат с Кадди: передать менеджеру',
          items: [],
        }),
      })
      const result = await response.json()
      if (response.ok) setSent({ number: result.number, crm: result.crm ?? 'demo' })
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
            {sent.crm === 'demo'
              ? crmDoneText(sent.crm)
              : 'Менеджер увидит весь разговор и свяжется с вами.'}
          </p>
        </div>
      ) : (
        <form className={styles.form} onSubmit={submit} noValidate>
          <div>
            <h3 className={styles.title}>Передать разговор менеджеру</h3>
            <p className={styles.lead}>Менеджер увидит всю переписку и продолжит с этого места.</p>
          </div>
          {prefill && prefill.details.length > 0 && (
            <dl className={styles.details}>
              {prefill.details.map((item) => (
                <div key={item.title} className={styles.detail}>
                  <dt>{item.title}</dt>
                  <dd>{item.value}</dd>
                </div>
              ))}
            </dl>
          )}
          <TextField
            label="Имя"
            name="name"
            id="kaddi-name"
            autoComplete="name"
            defaultValue={prefill?.name}
            error={errors.name}
          />
          <TextField
            label="Телефон"
            name="phone"
            id="kaddi-phone"
            type="tel"
            autoComplete="tel"
            placeholder="+7 701 123-45-67"
            defaultValue={prefill?.phone}
            error={errors.phone}
          />
          <TextAreaField
            label="Комментарий"
            name="comment"
            id="kaddi-comment"
            hint="Необязательно. Например, когда удобно говорить."
            rows={2}
            error={errors.comment}
          />
          <CheckboxField
            name="consent"
            id="kaddi-consent"
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
