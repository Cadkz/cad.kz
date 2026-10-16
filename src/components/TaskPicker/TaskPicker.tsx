'use client'

import { ArrowUp } from 'lucide-react'
import { type FormEvent, useId, useState } from 'react'
import { openAssistant } from '@/lib/openAssistant'
import { Mascot } from '../Mascot/Mascot'
import styles from './TaskPicker.module.css'

/** Короче — это не задача, а начало слова: просим дописать. */
const MIN_QUESTION = 3

type Task = { label: string; question: string }

type Props = {
  title: string
  placeholder: string
  tasks: Task[]
  note: string | null
  /** Номер WhatsApp (wa.me): куда уходит вопрос, если консультант на сайте выключен. */
  whatsappHref: string | null
}

/** Консультант выключен: вопрос уходит в WhatsApp уже набранным, без WhatsApp — в поиск по сайту. */
function fallback(question: string, whatsappHref: string | null) {
  if (whatsappHref) {
    const text = `Здравствуйте! Помогите подобрать: ${question}`
    window.open(`${whatsappHref}?text=${encodeURIComponent(text)}`, '_blank', 'noopener')
    return
  }
  window.location.assign(`/search?q=${encodeURIComponent(question)}`)
}

/**
 * Карточка «С чего начнём?» на первом экране главной: поле «опишите задачу» и кнопки задач.
 * Задача или набранный текст сразу уходят Кадди (чат открывается с вопросом). Без скриптов
 * форма ведёт в поиск по сайту.
 */
export function TaskPicker({ title, placeholder, tasks, note, whatsappHref }: Props) {
  const id = useId()
  const [text, setText] = useState('')

  const ask = (question: string) => {
    if (openAssistant(question)) setText('')
    else fallback(question, whatsappHref)
  }

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const question = text.trim()
    if (question.length < MIN_QUESTION) {
      event.currentTarget.querySelector('input')?.focus()
      return
    }
    ask(question)
  }

  return (
    <div className={styles.card}>
      <div className={styles.head}>
        <Mascot pose="head" size="icon" eager hover={false} />
        <p className={styles.title}>{title}</p>
      </div>
      <form className={styles.form} action="/search" onSubmit={submit}>
        <label htmlFor={id} className="visually-hidden">
          {placeholder}
        </label>
        <input
          id={id}
          name="q"
          className={styles.input}
          placeholder={placeholder}
          autoComplete="off"
          maxLength={300}
          value={text}
          onChange={(event) => setText(event.target.value)}
        />
        <button type="submit" className={styles.send} aria-label="Спросить Кадди">
          <ArrowUp size={20} strokeWidth={1.75} aria-hidden="true" />
        </button>
      </form>
      {tasks.length > 0 && (
        <ul className={styles.tasks}>
          {tasks.map((task) => (
            <li key={task.label}>
              <button type="button" className={styles.task} onClick={() => ask(task.question)}>
                {task.label}
              </button>
            </li>
          ))}
        </ul>
      )}
      {note && <p className={styles.note}>{note}</p>}
    </div>
  )
}
