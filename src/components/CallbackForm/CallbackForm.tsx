'use client'

import Link from 'next/link'
import { type FormEvent, useRef, useState } from 'react'
import { isEmail } from '@/domain/order.mjs'
import { type RequestKind, validateContact } from '@/domain/siteRequest.mjs'
import { type CrmState, crmDoneText } from '@/lib/crmNotice'
import { Button } from '../Button/Button'
import { CheckboxField } from '../CheckboxField/CheckboxField'
import { TextField } from '../Field/Field'
import type { RequestLine } from '../RequestDialog/RequestDialog'
import styles from './CallbackForm.module.css'

type Props = {
  kind: RequestKind
  pageProductId: number
  familySlug: string | null
  quantity: number
  choices: { title: string; value: string }[]
  lines: RequestLine[]
  /** Подпись нажатой кнопки: менеджер в Битрикс24 видит, откуда заявка. */
  button?: string
  /** Строка перед комментарием клиента, например «Демонстрация: в офисе CAD.kz». */
  note?: string
  /** Галочка «Запросить скидку» — у запроса цены и КП. */
  discount?: boolean
}

type Sent = { number: string; crm: CrmState }

/** Адрес политики конфиденциальности (перенесена со старого сайта). */
const PRIVACY_HREF = '/about/privacy-policy'

/**
 * Заявка со страницы товара (решение владельца 27.10.2026): имя и телефон обязательны, почта —
 * по желанию; у запроса цены — галочка «Запросить скидку». Согласие на обработку данных — строкой
 * под кнопкой: нажимая «Отправить», человек соглашается. Почта и просьба о скидке уходят менеджеру
 * строками комментария. Заявку сохраняет сервер (/api/request); в демо честно говорим, что
 * менеджерам она не уходит.
 */
export function CallbackForm(props: Props) {
  const { kind, pageProductId, familySlug, quantity, choices, lines, button, note } = props
  const key = useRef<string | null>(null)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [formError, setFormError] = useState('')
  const [sending, setSending] = useState(false)
  const [sent, setSent] = useState<Sent | null>(null)

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const data = new FormData(event.currentTarget)
    const email = String(data.get('email') ?? '').trim()
    const discount = data.get('discount') === 'on'
    const contact = {
      name: String(data.get('name') ?? ''),
      phone: String(data.get('phone') ?? ''),
      comment: [
        note,
        email ? `Почта: ${email}` : '',
        discount ? 'Просит скидку: предложить лучшую цену' : '',
      ]
        .filter(Boolean)
        .join('\n'),
      consent: true,
    }
    const checked = validateContact(contact)
    const found = checked.ok ? {} : { ...checked.errors }
    if (email && !isEmail(email)) found.email = 'Проверьте почту, например name@company.kz'
    setErrors(found)
    setFormError('')
    if (Object.keys(found).length) return
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
          button: discount ? 'Запросить скидку' : button,
          pageProductId,
          familySlug,
          quantity,
          choices,
          items: lines.map(({ productId, offerId }) => ({ productId, offerId })),
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

  if (sent)
    return (
      <div className={styles.done} role="status">
        <p className={styles.doneTitle}>Заявка {sent.number} сохранена</p>
        <p>{crmDoneText(sent.crm)}</p>
      </div>
    )

  return (
    <form className={styles.form} onSubmit={submit} noValidate>
      <div className={styles.pair}>
        <TextField
          label="Имя"
          name="name"
          id="callback-name"
          autoComplete="name"
          required
          error={errors.name}
        />
        <TextField
          label="Телефон"
          name="phone"
          id="callback-phone"
          type="tel"
          autoComplete="tel"
          placeholder="+7 701 123-45-67"
          required
          error={errors.phone}
        />
      </div>
      <TextField
        label="Почта"
        name="email"
        id="callback-email"
        type="email"
        autoComplete="email"
        hint="Пришлём расчёт и счёт на почту"
        error={errors.email}
      />
      {props.discount && (
        <CheckboxField
          name="discount"
          id="callback-discount"
          label="Запросить скидку — менеджер проверит акции и предложит лучшую цену"
        />
      )}
      {(formError || errors.items || errors.comment) && (
        <p className={styles.error} role="alert">
          {formError || errors.items || errors.comment}
        </p>
      )}
      <Button type="submit" block disabled={sending}>
        {sending ? 'Отправляем…' : 'Отправить заявку'}
      </Button>
      <p className={styles.consent}>
        Нажимая «Отправить заявку», вы соглашаетесь на обработку персональных данных по{' '}
        <Link href={PRIVACY_HREF}>политике конфиденциальности</Link>.
      </p>
    </form>
  )
}
