'use client'

import { useState } from 'react'
import { AdminButton } from '@/components/AdminButton/AdminButton'
import styles from './KnowledgeNote.module.css'

type Props = {
  /** Вопрос клиента, на который ответил Кадди, — попадает в запись, чтобы факт был понятен сам. */
  question: string
}

type Status = 'idle' | 'open' | 'saving' | 'saved' | 'error'

/** Текст записи базы знаний: вопрос клиента и как правильно, словами владельца. */
export function noteText(question: string, comment: string) {
  const ask = question.trim()
  return ask ? `На вопрос клиента «${ask}»: ${comment.trim()}` : comment.trim()
}

/**
 * «Поправить» под ответом Кадди в админке (просьба владельца 03.11.2026): комментарий сразу
 * становится включённой записью «Базы знаний Кадди» — со следующего вопроса Кадди её учитывает
 * (кэш сайта сбрасывается при сохранении записи). Права — у редактора, запрос от его входа.
 */
export function KnowledgeNote({ question }: Props) {
  const [status, setStatus] = useState<Status>('idle')
  const [comment, setComment] = useState('')
  const [product, setProduct] = useState('Все')
  const [error, setError] = useState('')

  async function save() {
    setStatus('saving')
    try {
      const response = await fetch('/api/assistant-knowledge', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: noteText(question, comment),
          product: product.trim() || 'Все',
          active: true,
        }),
      })
      if (!response.ok) throw new Error(`код ${response.status}`)
      setStatus('saved')
      setComment('')
    } catch (failure) {
      setError(failure instanceof Error ? failure.message : 'нет связи')
      setStatus('error')
    }
  }

  if (status === 'idle' || status === 'saved')
    return (
      <div className={styles.row}>
        <AdminButton secondary onClick={() => setStatus('open')}>
          Поправить
        </AdminButton>
        {status === 'saved' && (
          <span className={styles.ok}>
            Добавлено в базу знаний — Кадди учтёт со следующего вопроса
          </span>
        )}
      </div>
    )

  return (
    <div className={styles.form}>
      <label className={styles.field}>
        Как правильно ответить (уйдёт в базу знаний)
        <textarea
          className={styles.input}
          rows={3}
          value={comment}
          maxLength={1800}
          onChange={(event) => setComment(event.target.value)}
          placeholder="Например: plotWAVE — монохромные (чёрно-белые) плоттеры, цветные — colorWAVE и imagePROGRAF."
        />
      </label>
      <label className={styles.field}>
        Продукт
        <input
          className={styles.input}
          value={product}
          onChange={(event) => setProduct(event.target.value)}
        />
      </label>
      <div className={styles.row}>
        <AdminButton disabled={!comment.trim() || status === 'saving'} onClick={save}>
          {status === 'saving' ? 'Сохраняю…' : 'В базу знаний'}
        </AdminButton>
        <AdminButton secondary onClick={() => setStatus('idle')}>
          Отмена
        </AdminButton>
        {status === 'error' && <span className={styles.error}>Не сохранилось: {error}</span>}
      </div>
    </div>
  )
}
