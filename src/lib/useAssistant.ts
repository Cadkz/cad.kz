'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { ASSISTANT_LIMITS, type AssistantCard } from '@/domain/assistant.mjs'

export type ChatMessage = {
  role: 'user' | 'assistant'
  content: string
  cards?: AssistantCard[]
}

type Stored = { id: string; messages: ChatMessage[] }

/** Разговор живёт до закрытия вкладки: переход по страницам и обновление его не теряют. */
const STORAGE_KEY = 'cadkz-assistant'

function readStored(): Stored | null {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY)
    const value: unknown = raw ? JSON.parse(raw) : null
    if (value && typeof value === 'object' && 'id' in value && 'messages' in value) {
      const { id, messages } = value as Stored
      if (typeof id === 'string' && Array.isArray(messages)) return { id, messages }
    }
  } catch {
    // Хранилище недоступно (приватный режим) — разговор просто начнётся заново.
  }
  return null
}

function writeStored(value: Stored) {
  try {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(value))
  } catch {
    // Не сохранилось — не страшно: разговор есть на сервере и в окне.
  }
}

/**
 * Состояние чата с Юки: сообщения, ожидание ответа, ошибка. История — на сервере, здесь копия
 * для показа. Новый вопрос нельзя отправить, пока Юки отвечает на прошлый.
 */
export function useAssistant() {
  const [conversationId, setConversationId] = useState('')
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [waiting, setWaiting] = useState(false)
  const [error, setError] = useState('')
  const lastQuestion = useRef('')

  useEffect(() => {
    const stored = readStored()
    setConversationId(stored?.id ?? crypto.randomUUID())
    if (stored) setMessages(stored.messages)
  }, [])

  useEffect(() => {
    if (conversationId) writeStored({ id: conversationId, messages })
  }, [conversationId, messages])

  const send = useCallback(
    async (text: string, retry = false) => {
      const message = text.trim()
      if (!message || waiting || !conversationId) return
      if (message.length > ASSISTANT_LIMITS.messageChars) {
        setError(`Сообщение длиннее ${ASSISTANT_LIMITS.messageChars} знаков — сократите его`)
        return
      }
      lastQuestion.current = message
      setError('')
      if (!retry) setMessages((list) => [...list, { role: 'user', content: message }])
      setWaiting(true)
      try {
        const response = await fetch('/api/assistant', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ conversationId, message }),
        })
        const result = await response.json()
        if (response.ok && typeof result.reply === 'string')
          setMessages((list) => [
            ...list,
            { role: 'assistant', content: result.reply, cards: result.cards ?? [] },
          ])
        else
          setError(
            result.error ||
              'Не получилось выполнить действие. Попробуйте ещё раз или передайте вопрос менеджеру.',
          )
      } catch {
        setError('Нет связи с сервером. Проверьте интернет и попробуйте ещё раз.')
      } finally {
        setWaiting(false)
      }
    },
    [conversationId, waiting],
  )

  const retry = useCallback(() => send(lastQuestion.current, true), [send])

  /** Новый разговор: прежний остаётся на сервере (и в лиде, если его передали менеджеру). */
  const restart = useCallback(() => {
    setConversationId(crypto.randomUUID())
    setMessages([])
    setError('')
  }, [])

  return { conversationId, messages, waiting, error, send, retry, restart }
}
