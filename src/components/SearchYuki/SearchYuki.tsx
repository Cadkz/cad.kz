'use client'

import { useEffect, useState } from 'react'
import { assistantOn, openAssistant } from '@/lib/openAssistant'
import { Mascot } from '../Mascot/Mascot'
import styles from './SearchYuki.module.css'

/** Короче — это не вопрос, а начало слова: чат открывается без сообщения. */
const MIN_QUESTION = 3

type Props = {
  query: string
  /** Ничего не нашлось: Юки с лупой крупнее, а не строкой внизу. */
  empty: boolean
  /** Закрыть подсказки поиска. */
  onPick: () => void
}

/**
 * Мини-Юки в подсказках поиска в шапке. Поиск понимает названия, а Юки — задачу своими словами:
 * «Спросить Юки» открывает чат и сразу задаёт ему набранный запрос. Ничего не нашлось — Юки
 * с лупой справа от кнопки, смотрит на неё (поза уже отражена, надпись на жилете ровная). Показывается, только когда консультант работает.
 */
export function SearchYuki({ query, empty, onPick }: Props) {
  const [on, setOn] = useState(false)
  useEffect(() => setOn(assistantOn()), [])
  if (!on) return null

  const question = query.trim()
  const ask = () => {
    onPick()
    openAssistant(question.length >= MIN_QUESTION ? question : undefined)
  }

  if (empty)
    return (
      <div className={styles.empty}>
        <div className={styles.text}>
          <p className={styles.lead}>Опишите задачу своими словами — Юки поможет подобрать.</p>
          <button type="button" className={styles.button} onClick={ask}>
            Спросить Юки
          </button>
        </div>
        <Mascot pose="search" size="avatar" eager hover={false} />
      </div>
    )

  return (
    <button type="button" className={styles.row} onClick={ask}>
      <Mascot pose="head" size="icon" eager hover={false} />
      <span>
        {question.length >= MIN_QUESTION ? (
          <>
            Спросить Юки: <span className={styles.query}>«{question}»</span>
          </>
        ) : (
          <>
            Не знаете, что искать? <span className={styles.query}>Спросить Юки</span>
          </>
        )}
      </span>
    </button>
  )
}
