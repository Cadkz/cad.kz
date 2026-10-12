'use client'

import { ChevronRight } from 'lucide-react'
import Link from 'next/link'
import { useEffect, useRef } from 'react'
import { ASSISTANT_GREETING, type AssistantCard, QUICK_ACTIONS } from '@/domain/assistant.mjs'
import type { useAssistant } from '@/lib/useAssistant'
import { Button } from '../Button/Button'
import { Mascot } from '../Mascot/Mascot'
import styles from './AssistantMessages.module.css'

type Props = {
  chat: ReturnType<typeof useAssistant>
  onHandoff: () => void
}

/** Ссылки на товары, которые Кади назвал в ответе. */
function Cards({ cards }: { cards: AssistantCard[] }) {
  return (
    <ul className={styles.cards}>
      {cards.map((card) => (
        <li key={card.id}>
          <Link href={card.href} className={styles.card}>
            <span className={styles.cardText}>
              <span className={styles.cardTitle}>{card.title}</span>
              <span className={styles.cardMeta}>
                {[card.vendor, card.price ?? 'Цена по запросу'].filter(Boolean).join(' · ')}
              </span>
            </span>
            <ChevronRight size={16} strokeWidth={1.75} aria-hidden="true" />
          </Link>
        </li>
      ))}
    </ul>
  )
}

/**
 * Лента разговора. Пусто — Кади с ноутбуком, приветствие и быстрые действия. Пока ждём ответ —
 * Кади думает (лапа у подбородка). Кади слева и смотрит вправо, на сообщения.
 * Новые сообщения объявляются скринридеру (role="log").
 */
export function AssistantMessages({ chat, onHandoff }: Props) {
  const end = useRef<HTMLDivElement>(null)
  const count = chat.messages.length

  // Новое сообщение или ожидание — лента прокручивается к концу.
  useEffect(() => {
    if (count || chat.waiting) end.current?.scrollIntoView({ block: 'end' })
  }, [count, chat.waiting])

  return (
    <div className={styles.feed} role="log" aria-live="polite" aria-relevant="additions">
      <div className={styles.intro}>
        <Mascot pose="laptop" size="sm" eager />
        <div className={styles.introText}>
          <p className={styles.bot}>{ASSISTANT_GREETING}</p>
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
        </div>
      ))}
      {chat.waiting && (
        <div className={styles.thinking} role="status">
          <Mascot pose="think" size="avatar" />
          <span className={styles.dots}>Кади думает</span>
        </div>
      )}
      {chat.error && (
        <div className={styles.error} role="alert">
          <p>{chat.error}</p>
          <div className={styles.actions}>
            <Button variant="outline" size="sm" onClick={chat.retry}>
              Повторить
            </Button>
            <Button variant="text" size="sm" onClick={onHandoff}>
              Передать менеджеру
            </Button>
          </div>
        </div>
      )}
      <div ref={end} />
    </div>
  )
}
