'use client'

import { ArrowUp, Headset } from 'lucide-react'
import { type FormEvent, type KeyboardEvent, useId, useState } from 'react'
import { ASSISTANT_LIMITS } from '@/domain/assistant.mjs'
import styles from './AssistantComposer.module.css'

type Props = {
  disabled: boolean
  onSend: (text: string) => void
  onHandoff: () => void
}

/** Сколько знаков осталось — показываем только у самого края лимита. */
const WARN_AT = ASSISTANT_LIMITS.messageChars - 100

/**
 * Поле вопроса: Enter — отправить, Shift+Enter — новая строка. Пока Кадди отвечает, отправить
 * нельзя, но печатать можно. Под полем — «Передать менеджеру».
 */
export function AssistantComposer({ disabled, onSend, onHandoff }: Props) {
  const [text, setText] = useState('')
  const fieldId = useId()
  const counterId = useId()
  const empty = !text.trim()

  function submit(event?: FormEvent) {
    event?.preventDefault()
    if (disabled || empty) return
    onSend(text)
    setText('')
  }

  function onKeyDown(event: KeyboardEvent<HTMLTextAreaElement>) {
    if (event.key === 'Enter' && !event.shiftKey && !event.nativeEvent.isComposing) submit(event)
  }

  return (
    <form className={styles.composer} onSubmit={submit}>
      <div className={styles.row}>
        <label htmlFor={fieldId} className="visually-hidden">
          Ваш вопрос Кадди
        </label>
        <textarea
          id={fieldId}
          className={styles.field}
          rows={2}
          maxLength={ASSISTANT_LIMITS.messageChars}
          placeholder="Например, нужен расчёт металлоконструкций"
          value={text}
          onChange={(event) => setText(event.target.value)}
          onKeyDown={onKeyDown}
          aria-describedby={text.length > WARN_AT ? counterId : undefined}
        />
        <button
          type="submit"
          className={styles.send}
          disabled={disabled || empty}
          aria-label="Отправить"
        >
          <ArrowUp size={20} strokeWidth={1.75} aria-hidden="true" />
        </button>
      </div>
      <div className={styles.bottom}>
        <button type="button" className={styles.handoff} onClick={onHandoff}>
          <Headset size={16} strokeWidth={1.75} aria-hidden="true" />
          Передать менеджеру
        </button>
        {text.length > WARN_AT && (
          <span id={counterId} className={styles.counter}>
            Осталось знаков: {ASSISTANT_LIMITS.messageChars - text.length}
          </span>
        )}
      </div>
    </form>
  )
}
