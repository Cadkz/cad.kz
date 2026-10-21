'use client'

import { type FormEvent, useRef, useState } from 'react'
import {
  CONSENT_TEXT,
  RENEW_PROGRAM_OPTIONS,
  RENEW_PROGRAMS,
  validateRenewal,
} from '@/domain/siteRequest.mjs'
import { type CrmState, crmDoneText } from '@/lib/crmNotice'
import { Button } from '../Button/Button'
import { CheckboxField } from '../CheckboxField/CheckboxField'
import { SelectField, TextAreaField, TextField } from '../Field/Field'
import { RadioChips } from '../RadioChips/RadioChips'
import styles from './RenewForm.module.css'

const OTHER = 'other'

const findProgram = (name: string | null | undefined) =>
  RENEW_PROGRAM_OPTIONS.find((p) => p.toLowerCase() === name?.trim().toLowerCase())

/** Программы выпадающего списка — те, которых нет среди кнопок. */
const MORE_PROGRAMS = RENEW_PROGRAM_OPTIONS.filter((p) => !RENEW_PROGRAMS.includes(p))

/**
 * Заявка на продление. Программа выбирается один раз (аудит 21.10.2026, М10): кнопки топов
 * продаж и «Другая»; список «Название программы» появляется только после «Другая», в нём
 * остальные частые программы и «Другая программа» — поле для своего названия. Номер лицензии
 * и число мест не спрашиваем — менеджер найдёт сам. Сохраняет сервер (/api/request,
 * источник renew). В демо честно говорим, что менеджерам заявка не уходит.
 */
export function RenewForm({ program: initial }: { program: string | null }) {
  const known = findProgram(initial)
  // ?program=other — «Другая программа»: поле названия пустое.
  const custom = !known && initial && initial.toLowerCase() !== OTHER ? initial : ''
  const key = useRef<string | null>(null)
  const [program, setProgram] = useState(known ?? (initial ? OTHER : (RENEW_PROGRAMS[0] ?? '')))
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [formError, setFormError] = useState('')
  const [sending, setSending] = useState(false)
  const [sent, setSent] = useState<{ number: string; crm: CrmState } | null>(null)

  // Кнопка «Другая» подсвечена для любой программы не с кнопок, в том числе пока не выбрана.
  const chip = RENEW_PROGRAMS.includes(program) ? program : OTHER
  const choose = (value: string) => setProgram(value === OTHER ? '' : value)
  const pick = (value: string) => {
    setProgram(value)
    if (value === OTHER)
      requestAnimationFrame(() => document.getElementById('renew-program-name')?.focus())
  }

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
        license: '',
        seats: '',
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
      <RadioChips
        legend="Какую программу продлить"
        name="renew-program"
        value={chip}
        options={[
          ...RENEW_PROGRAMS.map((p) => ({ value: p, label: p })),
          { value: OTHER, label: 'Другая' },
        ]}
        onChange={choose}
      />
      {chip === OTHER && (
        <SelectField
          label="Название программы"
          name="program-choice"
          id="renew-program-choice"
          value={program}
          onChange={(event) => pick(event.target.value)}
          error={program !== OTHER ? errors.program : undefined}
        >
          <option value="" disabled>
            Выберите программу
          </option>
          {MORE_PROGRAMS.map((p) => (
            <option key={p} value={p}>
              {p}
            </option>
          ))}
          <option value={OTHER}>Другая программа</option>
        </SelectField>
      )}
      {program === OTHER && (
        <TextField
          label="Какая программа"
          name="program"
          id="renew-program-name"
          placeholder="Например, Tekla Structures"
          defaultValue={custom}
          error={errors.program}
        />
      )}
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
        hint="Если знаете номер лицензии или число мест — напишите здесь. Нет — менеджер найдёт сам."
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
