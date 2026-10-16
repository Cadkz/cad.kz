'use client'

import { ChevronRight } from 'lucide-react'
import Link from 'next/link'
import { useEffect, useRef, useState } from 'react'
import {
  ASSISTANT_GREETING,
  ASSISTANT_GREETING_GRUMPY,
  type AssistantCard,
  QUICK_ACTIONS,
} from '@/domain/assistant.mjs'
import type { HandoffPrefill, useAssistant } from '@/lib/useAssistant'
import { Button } from '../Button/Button'
import { Mascot } from '../Mascot/Mascot'
import styles from './AssistantMessages.module.css'

type Props = {
  chat: ReturnType<typeof useAssistant>
  /** Чат часто дёргали: Кадди недовольный и приветствие другое (только пока разговора нет). */
  grumpy: boolean
  /** Открыть форму передачи менеджеру; prefill — данные, которые собрал Кадди. */
  onHandoff: (prefill?: HandoffPrefill) => void
}

/** Ссылки на товары, которые Кадди назвал в ответе. */
function Cards({ cards }: { cards: AssistantCard[] }) {
  return (
    <ul className={styles.cards}>
      {cards.map((card) => (
        <li key={card.href}>
          <Link href={card.href} className={styles.card}>
            <span className={styles.cardText}>
              <span className={styles.cardTitle}>{card.title}</span>
              <span className={styles.cardMeta}>
                {card.note ??
                  [card.vendor, card.price ?? 'Цена по запросу'].filter(Boolean).join(' · ')}
              </span>
            </span>
            <ChevronRight size={16} strokeWidth={1.75} aria-hidden="true" />
          </Link>
        </li>
      ))}
    </ul>
  )
}

/** Ответ готовится дольше этого — Кадди садится за ноутбук (только пока ответ правда ещё ждём). */
const LONG_WAIT_MS = 8000

/** Ожидание ответа: Кадди думает, а если ответ задерживается — работает за ноутбуком. */
function Waiting() {
  const [long, setLong] = useState(false)
  useEffect(() => {
    const timer = setTimeout(() => setLong(true), LONG_WAIT_MS)
    return () => clearTimeout(timer)
  }, [])
  return (
    <div className={styles.thinking} role="status">
      <Mascot pose={long ? 'laptop' : 'think'} size="avatar" stage={false} />
      <span className={styles.dots}>
        {long ? 'Ещё немного, собираю ответ' : 'Проверю, что подойдёт для вашей задачи'}
      </span>
    </div>
  )
}

/**
 * Лента разговора. Пусто — Кадди с ноутбуком (крупно), приветствие и быстрые действия. После
 * первого вопроса Кадди у приветствия уходит: в окне один Кадди (решение владельца 16.10.2026) —
 * пока ждём ответ, он думает (лапа у подбородка) внизу ленты, у ответа. Кадди слева и смотрит
 * вправо, на сообщения.
 * Новые сообщения объявляются скринридеру (role="log").
 */
export function AssistantMessages({ chat, grumpy, onHandoff }: Props) {
  const end = useRef<HTMLDivElement>(null)
  const count = chat.messages.length
  const sulky = grumpy && !count
  // Кнопка передачи — только у последнего ответа, где Кадди её подготовил: данные там самые свежие.
  const lastHandoff = chat.messages.findLastIndex((m) => m.handoff)

  // Новое сообщение или ожидание — лента прокручивается к концу.
  useEffect(() => {
    if (count || chat.waiting) end.current?.scrollIntoView({ block: 'end' })
  }, [count, chat.waiting])

  return (
    <div className={styles.feed} role="log" aria-live="polite" aria-relevant="additions">
      <div className={styles.intro}>
        {!count && <Mascot pose={sulky ? 'grumpy' : 'laptop'} size="sm" eager stage={false} />}
        <div className={styles.introText}>
          <p className={styles.bot}>{sulky ? ASSISTANT_GREETING_GRUMPY : ASSISTANT_GREETING}</p>
          {!count && (
            <div className={styles.actions}>
              {QUICK_ACTIONS.map((action) => (
                <Button
                  key={action.id}
                  variant="outline"
                  size="sm"
                  disabled={chat.waiting}
                  onClick={() => (action.text ? chat.send(action.text) : onHandoff())}
                >
                  {action.label}
                </Button>
              ))}
            </div>
          )}
        </div>
      </div>
      {chat.messages.map((message, index) => (
        <div
          // Сообщения только добавляются в конец: порядковый номер устойчив.
          // biome-ignore lint/suspicious/noArrayIndexKey: у сообщений нет своих ID, список не переставляется
          key={index}
          className={message.role === 'user' ? styles.userRow : styles.botRow}
        >
          <p className={message.role === 'user' ? styles.user : styles.bot}>{message.content}</p>
          {message.cards && message.cards.length > 0 && <Cards cards={message.cards} />}
          {message.handoff && index === lastHandoff && (
            <Button size="sm" onClick={() => onHandoff(message.handoff)}>
              Проверить и передать менеджеру
            </Button>
          )}
        </div>
      ))}
      {chat.waiting && <Waiting />}
      {chat.error && (
        <div className={styles.error} role="alert">
          <p>{chat.error}</p>
          <div className={styles.actions}>
            <Button variant="outline" size="sm" onClick={chat.retry}>
              Повторить
            </Button>
            <Button variant="text" size="sm" onClick={() => onHandoff()}>
              Передать менеджеру
            </Button>
          </div>
        </div>
      )}
      <div ref={end} />
    </div>
  )
}
